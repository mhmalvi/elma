import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useVoiceIntegration = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [transcript, setTranscript] = useState('')
  
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
    setIsProcessingVoice(true)
    
    try {
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

      // Send to voice-to-text function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      })

      if (error) throw error

      const transcribedText = data.text
      setTranscript(transcribedText)
      
      return transcribedText
    } catch (error) {
      console.error('Error processing audio:', error)
      toast({
        title: "Transcription Error", 
        description: "Failed to convert speech to text",
        variant: "destructive"
      })
      return null
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    setIsPlayingAudio(true)

    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text.slice(0, 1000), // Limit text length
          voice: 'Aria' // Use Aria voice for warm, calm speech
        }
      })

      if (error) throw error

      // Create audio element and play
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`)
      currentAudioRef.current = audio
      
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
      
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlayingAudio(false)
      toast({
        title: "Audio Error",
        description: "Failed to play audio response",
        variant: "destructive"
      })
    }
  }, [toast])

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
      setIsPlayingAudio(false)
    }
  }, [])

  return {
    isRecording,
    isProcessingVoice,
    isPlayingAudio,
    transcript,
    startRecording,
    stopRecording,
    speakText,
    stopAudio,
    setTranscript
  }
}