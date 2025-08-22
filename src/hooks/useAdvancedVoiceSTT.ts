import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceSTTState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  detectedLanguage: string;
  error: string | null;
  isSupported: boolean;
  wordCount: number;
  characterCount: number;
}

export interface VoiceLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  whisperCode: string;
  webSpeechCode: string;
}

export const ADVANCED_LANGUAGES: VoiceLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', whisperCode: 'en', webSpeechCode: 'en-US' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, whisperCode: 'ar', webSpeechCode: 'ar-SA' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', whisperCode: 'bn', webSpeechCode: 'bn-BD' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true, whisperCode: 'ur', webSpeechCode: 'ur-PK' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', whisperCode: 'hi', webSpeechCode: 'hi-IN' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', whisperCode: 'tr', webSpeechCode: 'tr-TR' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', whisperCode: 'fr', webSpeechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', whisperCode: 'de', webSpeechCode: 'de-DE' },
];

export const useAdvancedVoiceSTT = () => {
  const { toast } = useToast();
  
  const [sttState, setSTTState] = useState<VoiceSTTState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    detectedLanguage: 'en',
    error: null,
    isSupported: false,
    wordCount: 0,
    characterCount: 0
  });

  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  
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
    const mediaDevicesSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    setSTTState(prev => ({
      ...prev,
      isSupported: (webSpeechSupported || mediaRecorderSupported) && mediaDevicesSupported
    }));

    console.log('[Advanced STT] Support Check:', {
      webSpeech: webSpeechSupported,
      mediaRecorder: mediaRecorderSupported,
      mediaDevices: mediaDevicesSupported,
      userAgent: navigator.userAgent
    });
  }, []);

  // Advanced language detection using audio patterns
  const detectLanguageFromAudio = useCallback((transcript: string): string => {
    // Simple language detection based on character patterns
    const arabicPattern = /[\u0600-\u06FF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const urduPattern = /[\u0600-\u06FF].*[\u0627-\u06FF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    
    if (arabicPattern.test(transcript)) {
      return urduPattern.test(transcript) ? 'ur' : 'ar';
    }
    if (bengaliPattern.test(transcript)) return 'bn';
    if (hindiPattern.test(transcript)) return 'hi';
    
    return 'en'; // Default fallback
  }, []);

  // Initialize Web Speech Recognition with enhanced features
  const initializeWebSpeech = useCallback((language: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('[Advanced STT] Web Speech API not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    const selectedLang = ADVANCED_LANGUAGES.find(l => l.code === language);
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang?.webSpeechCode || 'en-US';
    
    // Set maxAlternatives if supported
    if ('maxAlternatives' in recognition) {
      (recognition as any).maxAlternatives = 3;
    }

    recognition.onstart = () => {
      console.log('[Advanced STT] Web Speech Recognition started');
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
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
          console.log('[Advanced STT] Final:', transcript, 'Confidence:', confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Detect language from transcript
      const detectedLang = finalTranscript ? detectLanguageFromAudio(finalTranscript) : language;

      setSTTState(prev => {
        const newTranscript = prev.transcript + finalTranscript;
        return {
          ...prev,
          transcript: newTranscript,
          interimTranscript,
          confidence: maxConfidence || prev.confidence,
          detectedLanguage: detectedLang,
          wordCount: newTranscript.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: newTranscript.length
        };
      });

      // Reset silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognition.stop();
        }
      }, 3000);
    };

    recognition.onerror = (event) => {
      console.error('[Advanced STT] Error:', event.error);
      
      if (event.error === 'no-speech') {
        console.log('[Advanced STT] No speech detected, trying MediaRecorder fallback');
        setTimeout(() => {
          startListeningWithMediaRecorder(language);
        }, 500);
        return;
      }
      
      if (event.error === 'not-allowed') {
        setSTTState(prev => ({
          ...prev,
          error: 'Microphone permission denied. Please allow microphone access and try again.',
          isListening: false,
          isProcessing: false
        }));
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
      console.log('[Advanced STT] Web Speech Recognition ended');
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
  }, [detectLanguageFromAudio]);

  // Advanced audio processing with Whisper fallback
  const processWithWhisper = useCallback(async (audioBlob: Blob, language: string) => {
    try {
      setSTTState(prev => ({ ...prev, isProcessing: true }));

      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in chunks to avoid memory issues
      const chunkSize = 8192;
      let binaryString = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binaryString);
      const selectedLang = ADVANCED_LANGUAGES.find(l => l.code === language);

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
      const detectedLang = detectLanguageFromAudio(transcript) || language;

      setSTTState(prev => {
        const newTranscript = prev.transcript + transcript;
        return {
          ...prev,
          transcript: newTranscript,
          confidence,
          detectedLanguage: detectedLang,
          isProcessing: false,
          error: null,
          wordCount: newTranscript.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: newTranscript.length
        };
      });

      return transcript;

    } catch (error) {
      console.error('[Advanced STT] Whisper error:', error);
      setSTTState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process audio',
        isProcessing: false
      }));
      return null;
    }
  }, [detectLanguageFromAudio]);

  // MediaRecorder fallback with enhanced audio processing
  const startListeningWithMediaRecorder = useCallback(async (language: string) => {
    try {
      console.log('[Advanced STT] Starting MediaRecorder for:', language);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }
      
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

      mediaRecorder.start(1000);

      setSTTState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        error: null
      }));

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);

      toast({
        title: "🎤 Recording (Enhanced Mode)",
        description: `Speak now in ${ADVANCED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`,
      });

    } catch (error) {
      console.error('[Advanced STT] MediaRecorder error:', error);
      setSTTState(prev => ({
        ...prev,
        error: 'Failed to access microphone',
        isListening: false,
        isProcessing: false
      }));
    }
  }, [processWithWhisper, toast]);

  // Enhanced stop listening with cleanup
  const stopListening = useCallback(() => {
    console.log('[Advanced STT] Stopping STT');

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

  // Enhanced start listening with intelligent fallback
  const startListening = useCallback(async (language: string = 'en') => {
    try {
      console.log('[Advanced STT] Starting with language:', language);
      
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSTTState(prev => ({
          ...prev,
          error: 'Browser not supported. Please use a modern browser with HTTPS.',
          isListening: false,
          isProcessing: false
        }));
        return;
      }
      
      setCurrentLanguage(language);
      
      setSTTState(prev => ({
        ...prev,
        error: null,
        isProcessing: true,
        transcript: '',
        interimTranscript: '',
        detectedLanguage: language,
        wordCount: 0,
        characterCount: 0
      }));

      // Check microphone permissions first
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported');
        }
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Clean up the permission test stream
        permissionStream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error('[Advanced STT] Permission denied:', permissionError);
        setSTTState(prev => ({
          ...prev,
          error: 'Microphone permission denied or not supported. Please allow microphone access and ensure you\'re using HTTPS.',
          isListening: false,
          isProcessing: false
        }));
        return;
      }

      // Try Web Speech API first for real-time streaming
      const recognition = initializeWebSpeech(language);
      
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        
        toast({
          title: "🎤 Enhanced Listening",
          description: `Real-time mode active for ${ADVANCED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`,
        });
        return;
      }

      // Fallback to MediaRecorder + Whisper
      await startListeningWithMediaRecorder(language);

    } catch (error) {
      console.error('[Advanced STT] Error starting:', error);
      
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
  }, [initializeWebSpeech, startListeningWithMediaRecorder, toast]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setSTTState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      error: null,
      wordCount: 0,
      characterCount: 0
    }));
  }, []);

  // Change language
  const changeLanguage = useCallback((language: string) => {
    setCurrentLanguage(language);
    setSTTState(prev => ({
      ...prev,
      detectedLanguage: language
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
    currentLanguage,
    startListening,
    stopListening,
    clearTranscript,
    changeLanguage,
    supportedLanguages: ADVANCED_LANGUAGES
  };
};