import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Rate limit: 60/min per user
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      endpoint_name: 'query-islamic-content',
      max_requests: 60,
      window_minutes: 1,
    });
    if (rlError) {
      console.error('Rate limit error:', rlError);
      return new Response(JSON.stringify({ error: 'Rate limiter unavailable' }), { status: 503, headers: corsHeaders });
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: corsHeaders });
    }

    const { query, limit = 5 } = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }

    console.log('Searching Islamic content for:', query)

    // Generate embedding for the query using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding')
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    console.log('Generated query embedding')

    // Search Qdrant for similar content
    const qdrantUrl = Deno.env.get('QDRANT_ENDPOINT')
    const qdrantApiKey = Deno.env.get('QDRANT_API_KEY')

    if (!qdrantUrl || !qdrantApiKey) {
      console.log('Qdrant not configured, falling back to database search')
      
      // Fallback to simple text search in database
      const { data: quranResults } = await supabase
        .from('quran_verses')
        .select('*')
        .textSearch('translation_english', query)
        .limit(3)

      const { data: hadithResults } = await supabase
        .from('hadith_collection')
        .select('*')
        .textSearch('translation_english', query)
        .limit(2)

      return new Response(
        JSON.stringify({
          results: [
            ...(quranResults || []).map(r => ({ ...r, source_type: 'quran' })),
            ...(hadithResults || []).map(r => ({ ...r, source_type: 'hadith' }))
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search in Qdrant vector database
    const searchResponse = await fetch(`${qdrantUrl}/collections/islamic_content/points/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': qdrantApiKey,
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        limit,
        with_payload: true,
        score_threshold: 0.7
      }),
    })

    if (!searchResponse.ok) {
      console.error('Qdrant search failed, falling back to database')
      
      // Fallback to database search
      const { data: results } = await supabase
        .from('quran_verses')
        .select('*')
        .textSearch('translation_english', query)
        .limit(limit)

      return new Response(
        JSON.stringify({ results: results || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchResults = await searchResponse.json()
    console.log(`Found ${searchResults.result.length} relevant Islamic content pieces`)

    // Format results for the AI
    const formattedResults = searchResults.result.map((item: any) => ({
      id: item.id,
      score: item.score,
      source_type: item.payload.source_type,
      content: item.payload.text,
      reference: item.payload.reference,
      metadata: item.payload
    }))

    return new Response(
      JSON.stringify({ results: formattedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in query-islamic-content function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})