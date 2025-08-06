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
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // System prompt for Islamic Q&A
    const systemPrompt = `You are AirChatBot, an Islamic AI assistant that provides authentic answers based on the Quran and Hadith. 

Guidelines:
- Answer questions about Islam using only authentic sources from the Quran and Hadith
- Provide warm, compassionate responses in a conversational tone
- Keep answers concise (2-3 sentences) unless asked to explain more
- Always cite your sources (Surah name and verse number, or Hadith collection)
- If you don't know something or it's not in authentic sources, say so honestly
- Focus on spiritual guidance, moral teachings, and practical Islamic living
- Be respectful of different schools of thought when they exist

Example response format:
"In Islam, patience is highly valued. Allah says in the Quran: 'And give good tidings to the patient' (Al-Baqarah 2:155). The Prophet (peace be upon him) also said: 'No one can be given a blessing better and greater than patience' (Sahih Bukhari).

Source: Quran 2:155, Sahih Bukhari"`;

    // Call OpenRouter API
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

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true 
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