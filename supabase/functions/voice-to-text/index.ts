import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    return new Response('ok', { headers: dynamicHeaders });
  }

  if (!validateOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 });
  }

  const dynamicCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': origin || corsHeaders['Access-Control-Allow-Origin']
  };

  try {
    // Authenticate user
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: dynamicCorsHeaders })
    }

    // Rate limit: 20/min per user
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      endpoint_name: 'voice-to-text',
      max_requests: 20,
      window_minutes: 1,
    })
    if (rlError) {
      console.error('Rate limit error:', rlError)
      return new Response(JSON.stringify({ error: 'Rate limiter unavailable' }), { status: 503, headers: dynamicCorsHeaders })
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: dynamicCorsHeaders })
    }

    const { audio, language, metadata } = await req.json()
    
    // Comprehensive audio input validation
    if (!audio) {
      throw new Error('No audio data provided')
    }
    
    if (typeof audio !== 'string') {
      throw new Error('Audio data must be a base64 string')
    }
    
    // Validate base64 format
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(audio)) {
      throw new Error('Invalid audio data format - must be valid base64')
    }
    
    // Size limits: Max 50MB for audio (base64 adds ~33% overhead)
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024 * 1.33; // 66.5MB in base64
    const MIN_AUDIO_SIZE = 100; // Minimum 100 bytes
    
    if (audio.length > MAX_AUDIO_SIZE) {
      throw new Error(`Audio data too large. Maximum size: ${Math.round(MAX_AUDIO_SIZE / (1024 * 1024))}MB`)
    }
    
    if (audio.length < MIN_AUDIO_SIZE) {
      throw new Error('Audio data too small - minimum 100 bytes required')
    }
    
    // Validate audio content by checking for common audio file headers in base64
    try {
      const firstBytes = atob(audio.substring(0, 40)); // Decode first ~30 bytes
      const isValidAudio = (
        firstBytes.includes('RIFF') || // WAV
        firstBytes.includes('OggS') || // OGG
        firstBytes.includes('ID3') ||  // MP3
        firstBytes.includes('fLaC') || // FLAC
        firstBytes.startsWith('\x1a\x45\xdf\xa3') || // WebM/MKV
        firstBytes.includes('webm') ||
        firstBytes.includes('opus')
      );
      
      if (!isValidAudio) {
        throw new Error('Invalid audio format - file does not appear to be valid audio data')
      }
    } catch (decodeError) {
      throw new Error('Failed to validate audio format - invalid base64 encoding')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Privacy-safe logging: only size and language, no audio content
    console.log('Processing audio data...', {
      audioSizeKB: Math.round(audio.length / 1024),
      language: language || 'auto-detect',
      hasMetadata: !!metadata,
      requestId: user.id.substring(0, 8) + '...'
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
        // Privacy-safe logging: no transcript content, only metadata
        console.log('Transcription successful:', {
          textLength: result.text?.length || 0,
          duration: result.duration,
          language: result.language,
          hasSegments: !!result.segments?.length
        })

        return new Response(
          JSON.stringify({ 
            text: result.text,
            confidence: result.segments?.[0]?.avg_logprob || null,
            duration: result.duration,
            language: result.language
          }),
          { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
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
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})