import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface STTState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  language: string;
  isSupported: boolean;
}

export interface STTLanguage {
  code: string;
  name: string;
  whisperCode: string;
  webSpeechCode: string;
}

export const SUPPORTED_LANGUAGES: STTLanguage[] = [
  { code: 'en', name: 'English', whisperCode: 'en', webSpeechCode: 'en-US' },
  { code: 'ar', name: 'العربية', whisperCode: 'ar', webSpeechCode: 'ar-SA' },
  { code: 'ur', name: 'اردو', whisperCode: 'ur', webSpeechCode: 'ur-PK' },
  { code: 'bn', name: 'বাংলা', whisperCode: 'bn', webSpeechCode: 'bn-BD' },
  { code: 'hi', name: 'हिन्दी', whisperCode: 'hi', webSpeechCode: 'hi-IN' },
  { code: 'tr', name: 'Türkçe', whisperCode: 'tr', webSpeechCode: 'tr-TR' },
  { code: 'fr', name: 'Français', whisperCode: 'fr', webSpeechCode: 'fr-FR' },
  { code: 'de', name: 'Deutsch', whisperCode: 'de', webSpeechCode: 'de-DE' },
];

export const useRealtimeSTT = () => {
  const { toast } = useToast();
  
  const [sttState, setSTTState] = useState<STTState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null,
    language: 'en',
    isSupported: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const webSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const mediaRecorderSupported = 'MediaRecorder' in window;
    
    setSTTState(prev => ({
      ...prev,
      isSupported: webSpeechSupported || mediaRecorderSupported
    }));

    console.log('STT Support Check:', {
      webSpeech: webSpeechSupported,
      mediaRecorder: mediaRecorderSupported,
      userAgent: navigator.userAgent
    });
  }, []);

  // Initialize Web Speech Recognition (for real-time streaming)
  const initializeWebSpeech = useCallback((language: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Web Speech API not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === language);
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang?.webSpeechCode || 'en-US';
    
    // Increase timeout to give more time for speech detection
    if ('maxAlternatives' in recognition) {
      (recognition as any).maxAlternatives = 3;
    }

    recognition.onstart = () => {
      console.log('🎤 Web Speech Recognition STARTED successfully');
      setSTTState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        error: null
      }));
    };


    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('Final transcript:', transcript, 'Confidence:', confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setSTTState(prev => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        confidence: finalTranscript ? event.results[event.results.length - 1][0].confidence || 0.9 : prev.confidence
      }));

      // Reset silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognition.stop();
        }
      }, 3000); // Stop after 3 seconds of silence
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors
      if (event.error === 'no-speech') {
        console.log('No speech detected, switching to MediaRecorder fallback');
        // Auto-fallback to MediaRecorder for better audio detection
        setTimeout(() => {
          startListeningWithMediaRecorder(language);
        }, 500);
        return;
      }
      
      if (event.error === 'audio-capture') {
        setSTTState(prev => ({
          ...prev,
          error: 'Microphone access failed. Please check permissions.',
          isListening: false,
          isProcessing: false
        }));
        return;
      }
      
      setSTTState(prev => ({
        ...prev,
        error: `Speech recognition error: ${event.error}`,
        isListening: false,
        isProcessing: false
      }));
    };

    recognition.onend = () => {
      console.log('Web Speech Recognition ended');
      setSTTState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        interimTranscript: ''
      }));
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    return recognition;
  }, []);

  // Fallback to Whisper API for unsupported browsers or languages
  const processWithWhisper = useCallback(async (audioBlob: Blob, language: string) => {
    try {
      setSTTState(prev => ({ ...prev, isProcessing: true }));

      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in chunks to avoid stack overflow
      const chunkSize = 8192;
      let binaryString = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binaryString);
      const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          language: selectedLang?.whisperCode || 'en'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const transcript = data?.text?.trim() || '';
      const confidence = data?.confidence || 0.8;

      setSTTState(prev => ({
        ...prev,
        transcript: prev.transcript + transcript,
        confidence,
        isProcessing: false,
        error: null
      }));

      return transcript;

    } catch (error) {
      console.error('Whisper processing error:', error);
      setSTTState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process audio',
        isProcessing: false
      }));
      return null;
    }
  }, []);

  // MediaRecorder fallback method
  const startListeningWithMediaRecorder = useCallback(async (language: string) => {
    try {
      console.log('Starting MediaRecorder fallback for language:', language);
      
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processWithWhisper(audioBlob, language);
      };

      mediaRecorder.start(1000); // Collect data every second

      setSTTState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        error: null
      }));

      // Auto-stop after 15 seconds for fallback
      recordingTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 15000);

      toast({
        title: "🎤 Recording (Fallback Mode)",
        description: `Speak now in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`,
      });

    } catch (error) {
      console.error('MediaRecorder fallback error:', error);
      setSTTState(prev => ({
        ...prev,
        error: 'Failed to access microphone',
        isListening: false,
        isProcessing: false
      }));
    }
  }, [processWithWhisper, toast]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('Stopping STT');

    // Clear timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setSTTState(prev => ({
      ...prev,
      isListening: false,
      interimTranscript: ''
    }));
  }, []);

  // Start listening with best available method
  const startListening = useCallback(async (language: string = 'en') => {
    try {
      console.log('Starting STT with language:', language);
      
      setSTTState(prev => ({
        ...prev,
        error: null,
        isProcessing: true,
        transcript: '',
        interimTranscript: '',
        language
      }));

      // Try Web Speech API first for real-time streaming
      const recognition = initializeWebSpeech(language);
      
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        
        toast({
          title: "🎤 Listening...",
          description: `Speaking in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`,
        });
        return;
      }

      // Fallback to MediaRecorder + Whisper
      console.log('Falling back to MediaRecorder + Whisper');
      
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processWithWhisper(audioBlob, language);
      };

      mediaRecorder.start(1000); // Collect data every second

      setSTTState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false
      }));

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);

      toast({
        title: "🎤 Recording...",
        description: `Speak now in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`,
      });

    } catch (error) {
      console.error('Error starting STT:', error);
      
      let errorMessage = 'Failed to start voice input';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else {
          errorMessage = error.message;
        }
      }

      setSTTState(prev => ({
        ...prev,
        error: errorMessage,
        isListening: false,
        isProcessing: false
      }));

      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [initializeWebSpeech, processWithWhisper, toast]);


  // Clear transcript
  const clearTranscript = useCallback(() => {
    setSTTState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      error: null
    }));
  }, []);

  // Set language
  const setLanguage = useCallback((language: string) => {
    setSTTState(prev => ({
      ...prev,
      language
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    sttState,
    startListening,
    stopListening,
    clearTranscript,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};