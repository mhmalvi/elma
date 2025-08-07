import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utilities: logging, timeouts, retries
const truncate = (s: string, n = 80) => (s ? (s.length > n ? `${s.slice(0, n)}...` : s) : '');

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit,
  cfg: { timeoutMs?: number; maxRetries?: number; backoffMs?: number; retryOn?: number[] } = {},
): Promise<Response> {
  const timeoutMs = cfg.timeoutMs ?? 15000;
  const maxRetries = cfg.maxRetries ?? 2;
  const backoffMs = cfg.backoffMs ?? 800;
  const retryOn = cfg.retryOn ?? [408, 429, 500, 502, 503, 504];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!resp.ok && retryOn.includes(resp.status) && attempt < maxRetries) {
        await delay(backoffMs * (attempt + 1));
        continue;
      }
      return resp;
    } catch (err) {
      clearTimeout(id);
      // Retry on network/abort errors
      if (attempt < maxRetries) {
        await delay(backoffMs * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  // Should never reach here
  throw new Error('fetchWithTimeoutAndRetry: exhausted retries');
}

function mapErrorToStatus(e: any): number {
  const msg = String(e?.message || e);
  if (msg.includes('Unauthorized') || msg.includes('JWT') || msg.includes('auth')) return 401;
  if (msg.includes('Rate limit')) return 429;
  if (msg.includes('timeout') || msg.includes('aborted') || e?.name === 'AbortError') return 504;
  if (msg.includes('not configured') || msg.includes('missing')) return 500;
  return 502;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestId: string | null = null;
  let startedAt = Date.now();
  try {
    const { question, conversation_id, user_id } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    // Request context
    requestId = crypto.randomUUID();
    startedAt = Date.now();
    const safePreview = truncate(question, 80);
    console.log(`[ai-chat][${requestId}] Start len=${question.length} preview="${safePreview}"`);

    // Get environment variables
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY');
    const QDRANT_ENDPOINT = Deno.env.get('QDRANT_ENDPOINT');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const QDRANT_COLLECTION = Deno.env.get('QDRANT_COLLECTION') || 'islamic_content';

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log(`[ai-chat][${requestId}] Auth failed`);
    }

    console.log(`[ai-chat][${requestId}] Processing question len=${question.length}`);
    console.log(`[ai-chat][${requestId}] User=${user?.id || 'anonymous'}`);

    const endpoint = 'ai-chat';
    let currentConversationId: string | null = conversation_id || null;

    // Enforce authentication
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers: corsHeaders });
    }

    // Database-backed rate limiting via RPC: 60 req/min per user
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      endpoint_name: endpoint,
      max_requests: 60,
      window_minutes: 1
    });
    if (rlError) {
      console.error(`[ai-chat][${requestId}] Rate limit RPC error`);
      return new Response(JSON.stringify({ error: 'Rate limiter unavailable', requestId }), { status: 503, headers: corsHeaders });
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', requestId }), { status: 429, headers: corsHeaders });
    }

    let contextText = '';
    let qdrantResults = null;

    // Step 1: Try to get context from Qdrant if configured
    if (QDRANT_API_KEY && QDRANT_ENDPOINT) {
      try {
        console.log('Generating embedding for Qdrant search...');
        
        // Generate embedding using a simpler approach
        const embeddingResponse = await fetchWithTimeoutAndRetry('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: question,
          }),
        }, { timeoutMs: 10000, maxRetries: 2 });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const questionEmbedding = embeddingData.data[0].embedding;
          console.log('Generated embedding successfully');

          // Search Qdrant
          console.log(`[ai-chat][${requestId}] Searching Qdrant for relevant context...`);
          const searchResponse = await fetchWithTimeoutAndRetry(`${QDRANT_ENDPOINT}/collections/${QDRANT_COLLECTION}/points/search`, {
            method: 'POST',
            headers: {
              'api-key': QDRANT_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vector: questionEmbedding,
              limit: 3,
              with_payload: true,
              score_threshold: 0.6
            }),
          }, { timeoutMs: 8000, maxRetries: 1 });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            qdrantResults = searchData.result;
            console.log('Found relevant documents:', qdrantResults?.length || 0);
            
            if (qdrantResults && qdrantResults.length > 0) {
              contextText = qdrantResults
                .map((result: any) => {
                  const payload = result.payload;
                  let context = '';
                  if (payload.text) context += payload.text;
                  if (payload.verse) context += `\n[Verse: ${payload.verse}]`;
                  if (payload.hadith) context += `\n[Hadith: ${payload.hadith}]`;
                  if (payload.reference) context += `\n[Reference: ${payload.reference}]`;
                  return context;
                })
                .join('\n\n---\n\n');
            }
          } else {
            console.error(`[ai-chat][${requestId}] Qdrant search failed status=${searchResponse.status}`);
          }
        } else {
          console.error(`[ai-chat][${requestId}] Embedding generation failed status=${embeddingResponse.status}`);
        }
      } catch (qdrantError) {
        console.error('Qdrant integration error:', qdrantError);
        // Continue without Qdrant context
      }
    }

    // Fallback: DB semantic search if no Qdrant context
    if (!contextText) {
      try {
        const { data: searchData, error: searchErr } = await supabase
          .rpc('search_islamic_content', { search_query: question, result_limit: 3 });
        if (!searchErr && Array.isArray(searchData) && searchData.length > 0) {
          contextText = searchData
            .map((r: any) => `${r.content}\n[Reference: ${r.reference}]`)
            .join('\n\n---\n\n');
          console.log(`[ai-chat][${requestId}] Using fallback DB context count=${searchData.length}`);
        }
      } catch (_e) {
        console.log(`[ai-chat][${requestId}] Fallback search failed`);
      }
    }

    // Step 2: Generate AI response
    const systemPrompt = `You are AirChatBot, an Islamic AI assistant that provides authentic answers based on the Quran and Hadith.

${contextText ? `RELEVANT CONTEXT FROM ISLAMIC SOURCES:
${contextText}

Use this context to provide accurate answers. Always cite the specific sources mentioned in the context.` : ''}

Guidelines:
- Answer questions about Islam using only authentic sources from the Quran and Hadith
- If context is provided above, prioritize using that information and cite those specific sources
- Provide warm, compassionate responses in a conversational tone
- Keep answers concise (2-3 sentences) unless asked to explain more
- Always cite your sources (Surah name and verse number, or Hadith collection)
- If you don't know something or it's not in authentic sources, say so honestly
- Focus on spiritual guidance, moral teachings, and practical Islamic living
- Be respectful of different schools of thought when they exist

Example response format:
"In Islam, patience is highly valued. Allah says in the Quran: 'And give good tidings to the patient' (Al-Baqarah 2:155). The Prophet (peace be upon him) also said: 'No one can be given a blessing better and greater than patience' (Sahih Bukhari).

Source: Quran 2:155, Sahih Bukhari"`;

    console.log(`[ai-chat][${requestId}] Generating AI response...`);
    const aiResponse = await fetchWithTimeoutAndRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://airchatbot.lovable.app',
        'X-Title': 'AirChatBot - Islamic AI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    }, { timeoutMs: 20000, maxRetries: 2 });

    if (!aiResponse.ok) {
      console.error(`[ai-chat][${requestId}] OpenRouter API error status=${aiResponse.status}`);
      throw new Error(`Failed to generate AI response: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    // Step 3: Store conversation in Supabase if user is authenticated
    if (user) {
      try {
        // currentConversationId declared earlier

        // Create or get conversation
        if (!currentConversationId) {
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
              metadata: { first_question: question }
            })
            .select('id')
            .single();

          if (!convError && newConversation) {
            currentConversationId = newConversation.id;
          }
        }

        // Store user message
        if (currentConversationId) {
          await supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              user_id: user.id,
              content: question,
              role: 'user'
            });

          // Store AI response
          await supabase
            .from('chat_messages')
            .insert({
              conversation_id: currentConversationId,
              user_id: user.id,
              content: response,
              role: 'assistant',
              sources: qdrantResults ? qdrantResults.map((r: any) => r.payload) : [],
              qdrant_context: {
                used_context: contextText.length > 0,
                results_count: qdrantResults?.length || 0
              }
            });
        }
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue without storing - don't fail the request
      }
    }

    const durationMs = Date.now() - startedAt;
    console.log(`[ai-chat][${requestId}] Done in ${durationMs}ms contextUsed=${contextText.length > 0} qdrant=${qdrantResults?.length || 0}`);
    return new Response(
      JSON.stringify({ 
        answer: response,
        response,
        success: true,
        requestId,
        durationMs,
        contextUsed: contextText.length > 0,
        contextCount: qdrantResults?.length || 0,
        conversationId: currentConversationId || conversation_id || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    const status = mapErrorToStatus(error);
    const durationMs = Date.now() - startedAt;
    console.error(`[ai-chat][${requestId}] Error status=${status} duration=${durationMs}ms`, error);
    return new Response(
      JSON.stringify({
        error: String(error?.message || 'Unexpected error'),
        success: false,
        requestId,
        durationMs
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});