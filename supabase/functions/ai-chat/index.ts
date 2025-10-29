import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8080',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed origins for CORS validation
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

// Utilities: logging, timeouts, retries, sanitization
const truncate = (s: string, n = 80) => (s ? (s.length > n ? `${s.slice(0, n)}...` : s) : '');

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Input sanitization utility
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and encode special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (match) => ({ // Encode dangerous characters
      '<': '&lt;',
      '>': '&gt;', 
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }[match] || match))
    .trim();
}

// Content filtering for inappropriate content
function validateContent(input: string): { isValid: boolean; reason?: string } {
  const cleanInput = input.toLowerCase().trim();
  
  // Check length limits
  if (cleanInput.length === 0) {
    return { isValid: false, reason: 'Empty content' };
  }
  
  if (cleanInput.length > 10000) {
    return { isValid: false, reason: 'Content too long (max 10,000 characters)' };
  }
  
  // Basic profanity and inappropriate content filter
  const inappropriatePatterns = [
    /\b(fuck|shit|damn|bitch|asshole|bastard)\b/gi,
    /\b(hate|kill|murder|suicide|bomb|terrorist|violence)\b/gi,
    /(script|javascript|<|>|eval|function)/gi // Basic XSS prevention
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(cleanInput)) {
      return { isValid: false, reason: 'Content contains inappropriate language or potentially harmful content' };
    }
  }
  
  return { isValid: true };
}

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
  // Validate origin for CORS security
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    if (!validateOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }
    const dynamicHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin || corsHeaders['Access-Control-Allow-Origin']
    };
    return new Response(null, { headers: dynamicHeaders });
  }

  if (!validateOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 });
  }

  const dynamicCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': origin || corsHeaders['Access-Control-Allow-Origin']
  };

  let requestId: string | null = null;
  let startedAt = Date.now();
  try {
    const { question, conversation_id, user_id, correlation_id, language } = await req.json();
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Question is required');
    }

    // Sanitize and validate input
    const sanitizedQuestion = sanitizeInput(question);
    const contentValidation = validateContent(sanitizedQuestion);
    
    if (!contentValidation.isValid) {
      console.log(`[ai-chat] Input validation failed: ${contentValidation.reason}`);
      return new Response(
        JSON.stringify({ 
          error: contentValidation.reason, 
          success: false,
          requestId: correlation_id || crypto.randomUUID()
        }), 
        { 
          status: 400, 
          headers: dynamicCorsHeaders 
        }
      );
    }

    const lang = typeof language === 'string' ? String(language).toLowerCase() : 'en';
    const supportedLangs = new Set(['en','ar','bn','hi','ur']);
    const safeLang = supportedLangs.has(lang) ? (lang as 'en'|'ar'|'bn'|'hi'|'ur') : 'en';

    requestId = correlation_id || crypto.randomUUID();
    startedAt = Date.now();
    const safePreview = truncate(sanitizedQuestion, 40);
    console.log(`[ai-chat][${requestId}] Start len=${sanitizedQuestion.length} preview="${safePreview}"`);

    // Get environment variables
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY');
    const QDRANT_ENDPOINT = Deno.env.get('QDRANT_ENDPOINT');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const QDRANT_COLLECTION = Deno.env.get('QDRANT_COLLECTION') || 'documents_pdf_texts';

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

    console.log(`[ai-chat][${requestId}] Processing question len=${sanitizedQuestion.length}`);
    console.log(`[ai-chat][${requestId}] User=${user?.id || 'anonymous'}`);

    const endpoint = 'ai-chat';
    let currentConversationId: string | null = conversation_id || null;

    // Enforce authentication
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), { status: 401, headers: dynamicCorsHeaders });
    }

    // Database-backed rate limiting via RPC: 60 req/min per user
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      endpoint_name: endpoint,
      max_requests: 60,
      window_minutes: 1
    });
    if (rlError) {
      console.error(`[ai-chat][${requestId}] Rate limit RPC error`);
      return new Response(JSON.stringify({ error: 'Rate limiter unavailable', requestId }), { status: 503, headers: dynamicCorsHeaders });
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', requestId }), { status: 429, headers: dynamicCorsHeaders });
    }

    let contextText = '';
    let qdrantResults = null;

    // Step 1: Try to get context from Qdrant if configured
    if (QDRANT_API_KEY && QDRANT_ENDPOINT) {
      try {
        console.log('Generating embedding for Qdrant search...');
        
        if (!OPENAI_API_KEY) {
          console.warn(`[ai-chat][${requestId}] OPENAI_API_KEY missing; skipping Qdrant search`);
        } else {
          // Generate embeddings using OpenAI directly for compatibility
          const embeddingResponse = await fetchWithTimeoutAndRetry('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: sanitizedQuestion,
            }),
          }, { timeoutMs: 10000, maxRetries: 2 });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const questionEmbedding = embeddingData?.data?.[0]?.embedding;
            if (questionEmbedding) {
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
              console.warn(`[ai-chat][${requestId}] No embedding returned by OpenAI`);
            }
          } else {
            console.error(`[ai-chat][${requestId}] OpenAI embeddings error status=${embeddingResponse.status}`);
          }
        }
      } catch (qdrantError) {
        console.error('Qdrant integration error:', qdrantError);
        // Continue without Qdrant context
      }
    }

    // Enhanced Qdrant-only fallback: try broader search with lower threshold if no context found
    if (!contextText && QDRANT_API_KEY && QDRANT_ENDPOINT) {
      try {
        console.log(`[ai-chat][${requestId}] No context from primary search, trying broader search with lower threshold`);
        
        // Try the same collection with lower threshold and more results
        const fallbackResponse = await fetchWithTimeoutAndRetry(
          `${QDRANT_ENDPOINT}/collections/${QDRANT_COLLECTION}/points/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': QDRANT_API_KEY,
            },
            body: JSON.stringify({
              vector: queryEmbedding,
              limit: 3,
              score_threshold: 0.5, // Lower threshold for broader results
              with_payload: true
            }),
          },
          { timeoutMs: 8000, maxRetries: 1 }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackResults = fallbackData.result;
          
          if (fallbackResults && fallbackResults.length > 0) {
            contextText = fallbackResults
              .map((result: any) => {
                const payload = result.payload;
                let context = payload.text || '';
                if (payload.source) {
                  context += `\n[Source: ${payload.source}`;
                  if (payload.page) context += `, Page: ${payload.page}`;
                  context += ']';
                }
                return context;
              })
              .join('\n\n---\n\n');
            
            console.log(`[ai-chat][${requestId}] Using fallback Qdrant context with lower threshold, count=${fallbackResults.length}`);
          }
        }
      } catch (fallbackError) {
        console.log(`[ai-chat][${requestId}] Qdrant fallback search failed:`, fallbackError);
      }
    }

    // Step 2: Generate AI response
    const languageNames: Record<string, string> = { en: 'English', ar: 'Arabic', bn: 'Bengali', hi: 'Hindi', ur: 'Urdu' };
    const respondLanguageLine = safeLang !== 'en' ? `\n- Respond in ${languageNames[safeLang]} (${safeLang}) using appropriate script.` : '';

    const systemPrompt = `You are Elma, an Islamic AI assistant that provides authentic answers based on the Quran and Hadith.

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
- Be respectful of different schools of thought when they exist${respondLanguageLine}

Example response format:
"In Islam, patience is highly valued. Allah says in the Quran: 'And give good tidings to the patient' (Al-Baqarah 2:155). The Prophet (peace be upon him) also said: 'No one can be given a blessing better and greater than patience' (Sahih Bukhari).

Source: Quran 2:155, Sahih Bukhari"`;


    console.log(`[ai-chat][${requestId}] Generating AI response...`);
    const aiResponse = await fetchWithTimeoutAndRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ELMA - Islamic AI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedQuestion }
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
              title: sanitizedQuestion.substring(0, 100) + (sanitizedQuestion.length > 100 ? '...' : ''),
              metadata: { first_question: sanitizedQuestion }
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
              content: sanitizedQuestion,
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
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});