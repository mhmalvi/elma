import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Rate limit: 30/min per user
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      endpoint_name: 'text-to-voice',
      max_requests: 30,
      window_minutes: 1,
    })
    if (rlError) {
      console.error('Rate limit error:', rlError)
      return new Response(JSON.stringify({ error: 'Rate limiter unavailable' }), { status: 503, headers: corsHeaders })
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: corsHeaders })
    }

    console.log('Received request:', req.method)
    
    const requestBody = await req.json()
    console.log('Request body received:', { textLen: (requestBody?.text || '').length })
    
    const { text, voice, options } = requestBody


    if (!text) {
      console.error('No text provided in request')
      throw new Error('Text is required')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key missing from environment')
      throw new Error('ElevenLabs API key not configured')
    }

    // Use provided voice or default to Aria (9BWtsMINqrJLrRacOk9x)
    const voiceId = voice || '9BWtsMINqrJLrRacOk9x'
    const textLength = text.length

    console.log('Converting text to speech:', {
      text: text.substring(0, 50) + (textLength > 50 ? '...' : ''),
      voice: voiceId,
      length: textLength
    })

    // Enhanced voice settings with options override
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
      ...options?.voice_settings
    }

    const modelId = options?.model_id || 'eleven_multilingual_v2'

    const maxRetries = 2
    
    const makeRequest = async (attempt: number): Promise<Response> => {
      const elevenlabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
          output_format: 'mp3_44100_128'
        }),
      })

      if (!elevenlabsResponse.ok) {
        const error = await elevenlabsResponse.text()
        console.error('ElevenLabs API error:', error)
        
        if (attempt < maxRetries && elevenlabsResponse.status >= 500) {
          console.log(`Retrying request (${attempt + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          return makeRequest(attempt + 1)
        }
        
        throw new Error(`ElevenLabs API error (${elevenlabsResponse.status}): ${error}`)
      }

      // Convert audio buffer to base64 efficiently
      const arrayBuffer = await elevenlabsResponse.arrayBuffer()
      const audioSize = arrayBuffer.byteLength
      
      // Use Uint8Array for efficient base64 conversion
      const uint8Array = new Uint8Array(arrayBuffer)
      const chunks = []
      const chunkSize = 8192
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize)
        chunks.push(String.fromCharCode.apply(null, Array.from(chunk)))
      }
      
      const base64Audio = btoa(chunks.join(''))

      console.log('Successfully generated speech audio:', {
        size: audioSize,
        duration: Math.round(audioSize / 16000), // Rough estimate
        model: modelId,
        voice: voiceId
      })

      return new Response(
        JSON.stringify({ 
          audioContent: base64Audio,
          metadata: {
            size: audioSize,
            voice: voiceId,
            model: modelId,
            textLength
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return await makeRequest(0)
  } catch (error) {
    console.error('Error in text-to-voice function:', error)
    console.error('Error stack:', error.stack)
    
    // Return more detailed error information
    const errorMessage = error.message || 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})