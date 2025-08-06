import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

export const useAdvancedVoice = () => {
  const { toast } = useToast();
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    confidence: 0,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize audio context for voice activity detection
  const initializeAudioContext = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      return true;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      return false;
    }
  }, []);

  // Voice Activity Detection
  const detectVoiceActivity = useCallback(() => {
    if (!analyserRef.current) return false;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
    
    // Voice threshold (adjustable)
    const threshold = 30;
    return average > threshold;
  }, []);

  // Start voice recording with enhanced features
  const startListening = useCallback(async () => {
    try {
      setVoiceState(prev => ({ ...prev, error: null, isProcessing: true }));

      // Initialize audio if needed
      if (!audioContextRef.current) {
        const initialized = await initializeAudioContext();
        if (!initialized) {
          throw new Error('Failed to initialize audio system');
        }
      }

      // Request microphone access with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      streamRef.current = stream;

      // Connect to analyser for voice activity detection
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }

      // Setup MediaRecorder with optimized settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: true }));
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioBlob(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms

      setVoiceState(prev => ({
        ...prev,
        isConnected: true,
        isListening: true,
        isProcessing: false
      }));

      // Auto-stop on silence (with VAD)
      const checkSilence = () => {
        if (voiceState.isListening && detectVoiceActivity()) {
          // Reset silence timer if voice detected
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          silenceTimeoutRef.current = setTimeout(checkSilence, 500);
        } else if (voiceState.isListening) {
          // Stop recording after 2 seconds of silence
          silenceTimeoutRef.current = setTimeout(() => {
            stopListening();
          }, 2000);
        }
      };

      // Start silence detection after a brief delay
      setTimeout(checkSilence, 1000);

      toast({
        title: "Voice activated",
        description: "Speak now, I'm listening...",
      });

    } catch (error) {
      console.error('Error starting voice recording:', error);
      
      setVoiceState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
        isListening: false,
        isProcessing: false
      }));

      toast({
        title: "Voice activation failed",
        description: "Please check microphone permissions",
        variant: "destructive",
      });
    }
  }, [toast, detectVoiceActivity, voiceState.isListening]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setVoiceState(prev => ({
      ...prev,
      isListening: false
    }));
  }, []);

  // Process audio blob and send to STT service
  const processAudioBlob = useCallback(async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Send to Supabase Edge Function for STT
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw new Error(error.message);
      }

      const transcript = data?.text?.trim() || '';
      const confidence = data?.confidence || 0.8; // Default confidence

      setVoiceState(prev => ({
        ...prev,
        transcript,
        confidence,
        isProcessing: false,
        error: null
      }));

      if (transcript) {
        toast({
          title: "Speech recognized",
          description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking more clearly",
          variant: "destructive",
        });
      }

      return transcript;

    } catch (error) {
      console.error('Error processing audio:', error);
      
      setVoiceState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process audio',
        isProcessing: false
      }));

      toast({
        title: "Speech recognition failed",
        description: "Please try again",
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  // Speak text using TTS
  const speakText = useCallback(async (text: string, voice: string = '9BWtsMINqrJLrRacOk9x') => {
    try {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));

      // Limit text length to avoid quota issues
      const maxLength = 200;
      const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: truncatedText,
          voice: voice 
        }
      });

      if (error) {
        console.error('TTS Edge Function Error:', error);
        // Fallback to browser speech synthesis
        return await fallbackToWebSpeech(text);
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        
        return new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            setVoiceState(prev => ({ ...prev, isSpeaking: false }));
            resolve();
          };
          
          audio.onerror = () => {
            console.error('Audio playback error, falling back to web speech');
            fallbackToWebSpeech(text).then(resolve).catch(reject);
          };
          
          audio.play().catch(() => {
            console.error('Audio play failed, falling back to web speech');
            fallbackToWebSpeech(text).then(resolve).catch(reject);
          });
        });
      } else {
        throw new Error('No audio content received');
      }

    } catch (error) {
      console.error('Error in speakText:', error);
      return await fallbackToWebSpeech(text);
    }
  }, []);

  // Fallback to browser speech synthesis
  const fallbackToWebSpeech = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        resolve();
      };

      utterance.onerror = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        reject(new Error('Speech synthesis failed'));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [stopListening]);

  return {
    voiceState,
    startListening,
    stopListening,
    speakText,
    processAudioBlob
  };
};