import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, language, metadata } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing audio data...', {
      audioSize: typeof audio === 'string' ? audio.length : 'unknown',
      language: language || 'auto-detect',
      metadata: metadata || 'none'
    })

    // Process audio in chunks to prevent memory issues
    const binaryAudio = processBase64Chunks(audio)
    
    // Prepare optimized form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    
    // Add language if specified
    if (language && language !== 'auto') {
      formData.append('language', language)
    }
    
    formData.append('response_format', 'verbose_json') // Get confidence scores and timestamps

    console.log('Sending to OpenAI Whisper API...')

    // Enhanced API call with retry logic
    let retryCount = 0
    const maxRetries = 2
    
    while (retryCount <= maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('OpenAI API error:', errorText)
          
          if (retryCount < maxRetries && response.status >= 500) {
            retryCount++
            console.log(`Retrying request (${retryCount}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          }
          
          throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
        }

        const result = await response.json()
        console.log('Transcription successful:', {
          text: result.text?.substring(0, 100) + (result.text?.length > 100 ? '...' : ''),
          duration: result.duration,
          language: result.language
        })

        return new Response(
          JSON.stringify({ 
            text: result.text,
            confidence: result.segments?.[0]?.avg_logprob || null,
            duration: result.duration,
            language: result.language
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (fetchError) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Request failed, retrying (${retryCount}/${maxRetries})...`, fetchError)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          continue
        }
        throw fetchError
      }
    }

  } catch (error) {
    console.error('Error in voice-to-text function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})