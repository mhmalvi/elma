import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { question, conversation_id, user_id } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    // Get environment variables
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY');
    const QDRANT_ENDPOINT = Deno.env.get('QDRANT_ENDPOINT');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
      console.log('Authentication failed, proceeding without user context');
    }

    console.log('Processing question:', question);
    console.log('User ID:', user?.id);

    let contextText = '';
    let qdrantResults = null;

    // Step 1: Try to get context from Qdrant if configured
    if (QDRANT_API_KEY && QDRANT_ENDPOINT) {
      try {
        console.log('Generating embedding for Qdrant search...');
        
        // Generate embedding using a simpler approach
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

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const questionEmbedding = embeddingData.data[0].embedding;
          console.log('Generated embedding successfully');

          // Search Qdrant
          console.log('Searching Qdrant for relevant context...');
          const searchResponse = await fetch(`${QDRANT_ENDPOINT}/collections/islamic_knowledge/points/search`, {
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
          });

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
            console.error('Qdrant search failed:', await searchResponse.text());
          }
        } else {
          console.error('Embedding generation failed:', await embeddingResponse.text());
        }
      } catch (qdrantError) {
        console.error('Qdrant integration error:', qdrantError);
        // Continue without Qdrant context
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

    console.log('Generating AI response...');
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter API error:', errorText);
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
        let currentConversationId = conversation_id;

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

    console.log('Successfully generated response');
    return new Response(
      JSON.stringify({ 
        answer: response,
        response,
        success: true,
        contextUsed: contextText.length > 0,
        conversationId: conversation_id || null
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