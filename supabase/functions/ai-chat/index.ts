import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY');
    const QDRANT_ENDPOINT = Deno.env.get('QDRANT_ENDPOINT');

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    if (!QDRANT_API_KEY || !QDRANT_ENDPOINT) {
      throw new Error('Qdrant credentials are not configured');
    }

    console.log('Processing question:', question);

    // Step 1: Generate embedding for the question using OpenRouter
    console.log('Generating embedding for question...');
    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: question,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', errorText);
      throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;
    console.log('Generated embedding with dimension:', questionEmbedding.length);

    // Step 2: Search for relevant context in Qdrant
    console.log('Searching Qdrant for relevant context...');
    const searchResponse = await fetch(`${QDRANT_ENDPOINT}/collections/islamic_knowledge/points/search`, {
      method: 'POST',
      headers: {
        'api-key': QDRANT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: questionEmbedding,
        limit: 5,
        with_payload: true,
        score_threshold: 0.7
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Qdrant search error:', errorText);
      // Continue without RAG if Qdrant fails
      console.log('Continuing without RAG context due to Qdrant error');
    }

    let contextText = '';
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Found relevant documents:', searchData.result?.length || 0);
      
      if (searchData.result && searchData.result.length > 0) {
        contextText = searchData.result
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
        
        console.log('Retrieved context length:', contextText.length);
      }
    }

    // Step 3: Generate response with RAG context
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

    console.log('Generating AI response...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://airchatbot.lovable.app',
        'X-Title': 'AirChatBot - Islamic AI Assistant'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('Successfully generated response');
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true,
        contextUsed: contextText.length > 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});