import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useVoiceIntegration = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceMetrics, setVoiceMetrics] = useState({
    processingTime: 0,
    audioQuality: null as number | null,
    transcriptionConfidence: null as number | null,
  })
  const [speechMetrics, setSpeechMetrics] = useState({
    generationTime: 0,
    audioSize: 0,
    playbackStarted: false,
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  
  const { toast } = useToast()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudioBlob(audioBlob)
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTranscript('')
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const processAudioBlob = async (audioBlob: Blob) => {
    const startTime = performance.now()
    setIsProcessingVoice(true)
    
    try {
      // Calculate audio quality metrics
      const audioContext = new AudioContext()
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
      const audioQuality = calculateAudioQuality(audioBuffer)
      
      // Convert blob to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
      })
      reader.readAsDataURL(audioBlob)
      const base64Audio = await base64Promise

      // Send to voice-to-text function with metadata
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          metadata: {
            size: audioBlob.size,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate
          }
        }
      })

      const processingTime = performance.now() - startTime

      if (error) throw error

      const transcribedText = data.text
      setTranscript(transcribedText)
      
      // Update metrics
      setVoiceMetrics({
        processingTime,
        audioQuality,
        transcriptionConfidence: data.confidence || null,
      })
      
      return transcribedText
    } catch (error) {
      const processingTime = performance.now() - startTime
      console.error('Error processing audio:', error)
      
      setVoiceMetrics(prev => ({ ...prev, processingTime }))
      
      toast({
        title: "Transcription Error", 
        description: error instanceof Error ? error.message : "Failed to convert speech to text",
        variant: "destructive"
      })
      return null
    } finally {
      setIsProcessingVoice(false)
    }
  }

  // Audio quality calculation helper
  const calculateAudioQuality = (audioBuffer: AudioBuffer): number => {
    const channelData = audioBuffer.getChannelData(0)
    let sum = 0
    let peak = 0
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i])
      sum += sample * sample
      peak = Math.max(peak, sample)
    }
    
    const rms = Math.sqrt(sum / channelData.length)
    const snr = peak > 0 ? 20 * Math.log10(rms / peak) : -Infinity
    
    // Return a normalized quality score (0-100)
    return Math.max(0, Math.min(100, (snr + 60) * 100 / 60))
  }

  const speakText = useCallback(async (text: string, useHighQuality = true) => {
    if (!text.trim()) return

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setIsPlayingAudio(true)

    try {
      // Try ElevenLabs API first for high quality, fallback to Web Speech API
      const shouldUseElevenLabs = useHighQuality // Enable ElevenLabs for sophisticated TTS
      
      if (shouldUseElevenLabs) {
        const startTime = performance.now()
        
        const { data, error } = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: text.slice(0, 1000), // Limit text length for API efficiency
            voice: '9BWtsMINqrJLrRacOk9x', // Aria voice - warm, natural, engaging
            options: {
              model_id: 'eleven_multilingual_v2', // High-quality multilingual model
              voice_settings: {
                stability: 0.6,        // More stable, less random
                similarity_boost: 0.8, // Higher voice consistency
                style: 0.4,            // Moderate expressiveness
                use_speaker_boost: true // Enhanced clarity
              }
            }
          }
        })

        const generationTime = performance.now() - startTime

        if (error) throw error

        // Create audio element and play
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`)
        currentAudioRef.current = audio
        
        const audioSize = data.metadata?.size || 0
        
        audio.onloadstart = () => {
          setSpeechMetrics({
            generationTime,
            audioSize,
            playbackStarted: true,
          })
        }
        
        audio.onended = () => {
          setIsPlayingAudio(false)
          currentAudioRef.current = null
        }

        audio.onerror = () => {
          setIsPlayingAudio(false)
          currentAudioRef.current = null
          throw new Error('Audio playback failed')
        }

        await audio.play()
      } else {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          
          // Configure voice settings
          utterance.rate = 0.9
          utterance.pitch = 1
          utterance.volume = 0.8
          
          // Try to use a pleasant voice
          const voices = window.speechSynthesis.getVoices()
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.lang.startsWith('en')
          )
          if (preferredVoice) {
            utterance.voice = preferredVoice
          }
          
          utterance.onstart = () => {
            setIsPlayingAudio(true)
          }
          
          utterance.onend = () => {
            setIsPlayingAudio(false)
          }
          
          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error)
            setIsPlayingAudio(false)
          }
          
          window.speechSynthesis.speak(utterance)
        } else {
          throw new Error('Speech synthesis not supported in this browser')
        }
      }
      
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlayingAudio(false)
      
      toast({
        title: "Audio Error",
        description: error instanceof Error ? error.message : "Failed to play audio response",
        variant: "destructive"
      })
    }
  }, [toast])

  const stopAudio = useCallback(() => {
    // Stop audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    setIsPlayingAudio(false)
  }, [])

  return {
    isRecording,
    isProcessingVoice,
    isPlayingAudio,
    transcript,
    voiceMetrics,
    speechMetrics,
    startRecording,
    stopRecording,
    speakText,
    stopAudio,
    setTranscript
  }
}