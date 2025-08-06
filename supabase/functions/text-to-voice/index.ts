import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { text, voice, options } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Use provided voice or default to Aria
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

    // Enhanced API call with retry logic
    let retryCount = 0
    const maxRetries = 2
    
    while (retryCount <= maxRetries) {
      try {
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
          
          if (retryCount < maxRetries && elevenlabsResponse.status >= 500) {
            retryCount++
            console.log(`Retrying request (${retryCount}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          }
          
          throw new Error(`ElevenLabs API error (${elevenlabsResponse.status}): ${error}`)
        }

        // Convert audio buffer to base64
        const arrayBuffer = await elevenlabsResponse.arrayBuffer()
        const audioSize = arrayBuffer.byteLength
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        )

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
    console.error('Error in text-to-voice function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})