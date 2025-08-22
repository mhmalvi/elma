import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PremiumVoiceModeToggle } from '@/components/voice/PremiumVoiceModeToggle';
import { PremiumDictationInterface } from '@/components/voice/PremiumDictationInterface';
import { PremiumLiveConversationInterface } from '@/components/voice/PremiumLiveConversationInterface';
import { Send, Mic, Square, Play, Pause, VolumeX, Copy, Share, Bookmark, MoreHorizontal, Sparkles, MessageCircle, BookOpen, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';
import { useAutoTTS } from '@/hooks/useAutoTTS';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useVoiceModes } from '@/hooks/useVoiceModes';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  source?: {
    verse?: string;
    hadith?: string;
    reference?: string;
  };
  isProcessing?: boolean;
}
interface EnhancedChatInterfaceProps {
  className?: string;
}
export const EnhancedChatInterface = ({
  className
}: EnhancedChatInterfaceProps) => {
  const {
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    addBookmark,
    isBookmarked
  } = useBookmarks();
  const {
    toast
  } = useToast();
  const {
    currentMode,
    setMode
  } = useVoiceMode();
  const { language, languageInfo } = useLanguage();
  const { t } = useTranslation();

  // Use conversation management context
  const conversationHookResult = useConversationsContext();
  const {
    currentConversation,
    messages: conversationMessages,
    createConversation,
    addMessage,
    messagesLoading,
    selectConversation
  } = conversationHookResult;

  // Debug hook result
  console.log('ENHANCED CHAT INTERFACE - Hook result:', {
    currentConversation: currentConversation?.id,
    messagesCount: conversationMessages.length,
    hookResult: conversationHookResult
  });
  const {
    speakText,
    isPlayingAudio,
    stopAudio
  } = useVoiceIntegration();
  
  // Enhanced auto-TTS system
  const {
    autoSpeak,
    stopAutoSpeak,
    isAutoSpeaking,
    currentProvider
  } = useAutoTTS();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugMeta, setDebugMeta] = useState<{ requestId?: string; durationMs?: number; contextUsed?: boolean; contextCount?: number } | null>(null);
  const showDebug = typeof window !== 'undefined' && localStorage.getItem('airchat.debug') === 'true';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert conversation messages to display format
  const displayMessages = conversationMessages.map(msg => ({
    id: msg.id,
    text: msg.content,
    isUser: msg.role === 'user',
    timestamp: new Date(msg.created_at),
    source: msg.sources?.[0] || (msg.metadata as any)?.source
  }));

  // Critical debugging for UI state
  React.useEffect(() => {
    console.log('UI STATE DEBUG:');
    console.log('- Current conversation:', currentConversation?.id, currentConversation?.title);
    console.log('- Raw messages count:', conversationMessages.length);
    console.log('- Display messages count:', displayMessages.length);
    console.log('- Messages loading:', messagesLoading);
    console.log('- Raw messages:', conversationMessages);
  }, [currentConversation, conversationMessages, displayMessages, messagesLoading]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  // This effect will be moved after voice modes hook declaration

  // Send message to AI
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;
    setInputValue('');
    setIsProcessing(true);
    try {
      // Create conversation if none exists
      let conversation = currentConversation;
      if (!conversation) {
        console.log('Creating new conversation for message:', messageText);
        conversation = await createConversation(messageText.substring(0, 100));
        if (!conversation) {
          throw new Error('Failed to create conversation');
        }
        // CRITICAL FIX: Wait for conversation to be properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Conversation created and set:', conversation.id);
      }

      // OPTIMISTIC UI: Add user message immediately
      const userMessage = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversation.id,
        user_id: user?.id || '',
        content: messageText,
        role: 'user' as const,
        sources: [],
        qdrant_context: {},
        metadata: {},
        created_at: new Date().toISOString()
      };
      addMessage(userMessage);
      setDebugMeta(null);
      // Invoke with one automatic retry on transient errors (429/504/timeout)
      const invoke = async () =>
        await supabase.functions.invoke('ai-chat', {
          body: {
            question: messageText,
            user_id: user?.id,
            conversation_id: conversation.id,
            language
          }
        });

      let data: any | null = null;
      let error: any | null = null;
      let attempt = 0;
      do {
        const res = await invoke();
        data = res.data;
        error = res.error;
        if (!error) break;
        const em = String(error?.message || '');
        const status = (error as any)?.status as number | undefined;
        const retryable = status === 429 || status === 504 || /429|Rate limit|timeout/i.test(em);
        if (!retryable || attempt >= 1) break;
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
        attempt++;
      } while (attempt < 2);

      if (error) {
        console.error('AI chat error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      console.log('AI response received:', data);
      setDebugMeta({
        requestId: data?.requestId,
        durationMs: data?.durationMs,
        contextUsed: data?.contextUsed,
        contextCount: data?.contextCount,
      });

      // Add AI response to UI immediately
      if (data.answer || data.response) {
        const aiMessage = {
          id: `temp-ai-${Date.now()}`,
          conversation_id: conversation.id,
          user_id: user?.id || '',
          content: data.answer || data.response,
          role: 'assistant' as const,
          sources: data.sources || [],
          qdrant_context: data.qdrant_context || {},
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        };
        addMessage(aiMessage);

        // CRITICAL: Automatic TTS for AI responses with live mode optimization
        const responseText = data.answer || data.response;
        if (responseText) {
          console.log('[EnhancedChat] Auto-speaking AI response:', responseText.slice(0, 50));
          
          // Determine if auto-speak should be enabled based on mode
          const shouldAutoSpeak = currentMode === 'live' || currentMode === 'dictation';
          
          // For live mode, ensure immediate TTS playback
          if (shouldAutoSpeak) {
            // Stop any existing auto-speak to prevent overlap
            stopAutoSpeak();
            
            // Brief delay to ensure clean audio transition
            setTimeout(async () => {
              await autoSpeak(responseText, {
                autoSpeak: true,
                usePremium: true,
                interruptible: currentMode === 'live',
                language
              });
            }, currentMode === 'live' ? 100 : 0);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove the optimistic user message on error
      // The real-time subscription will handle proper message sync

      const rawMsg = String((error as any)?.message || '');
      let description = 'Failed to send message. Please try again.';
      if (/429|Rate limit/i.test(rawMsg)) description = 'You are being rate limited. Please wait a moment and try again.';
      else if (/timeout|504/i.test(rawMsg)) description = 'The server timed out. Please try again.';
      const errReqId = (error as any)?.context?.requestId;
      toast({
        title: 'Error',
        description: errReqId ? `${description} (req: ${String(errReqId).slice(0,8)})` : description,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Voice mode handlers with conversation state management
  const {
    handleDictationComplete,
    handleLiveTranscriptStream,
    handleLiveInterrupt,
    currentTranscript,
    conversationState
  } = useVoiceModes(sendMessage);

  // Handle current transcript from voice modes
  useEffect(() => {
    if (currentTranscript && currentTranscript.trim()) {
      setInputValue(currentTranscript);
    }
  }, [currentTranscript]);
  const handleSpeakMessage = async (text: string) => {
    if (isPlayingAudio || isAutoSpeaking) {
      // Stop both manual and auto TTS
      stopAudio();
      stopAutoSpeak();
    } else {
      // Use auto-TTS for manual speak as well for consistency
      await autoSpeak(text, {
        autoSpeak: true,
        usePremium: true,
        interruptible: true,
        language
      });
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message copied to clipboard"
    });
  };
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Welcome messages for empty state
  const welcomePrompts = ["What does Islam teach about patience?", "Can you explain the concept of Tawhid?", "What are the pillars of Islam?", "Tell me about the importance of prayer in Islam"];
  return <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {showDebug && debugMeta && (
            <div className="sticky top-2 z-10 flex justify-end">
              <div className="text-xs px-2 py-1 rounded-md border border-border bg-card shadow-sm">
                <span className="font-medium">req</span> {debugMeta.requestId?.slice(0,8) || '—'} • {debugMeta.durationMs ?? '—'}ms • ctx {debugMeta.contextCount ?? 0}
              </div>
            </div>
          )}
          {displayMessages.length === 0 && !currentConversation && !messagesLoading ?
        // Welcome State
        <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to ELMA</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your Islamic AI companion for authentic guidance from Quran and Hadith. 
                  Ask anything about Islamic teachings, life advice, or spiritual growth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">Voice First</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Speak naturally and get instant responses
                  </p>
                </Card>
                
                <Card className="p-4 border-secondary/20 bg-secondary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-secondary-foreground" />
                    <span className="font-medium">Authentic Sources</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All answers from verified Islamic texts
                  </p>
                </Card>
              </div>

              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-4">Try these example questions:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {welcomePrompts.map((prompt, index) => <Button key={index} variant="outline" size="sm" onClick={() => sendMessage(prompt)} className="text-xs hover:bg-primary/10" disabled={isProcessing}>
                      <Quote className="w-3 h-3 mr-1" />
                      {prompt}
                    </Button>)}
                </div>
              </div>
            </div> : messagesLoading ?
        // Loading state
        <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading conversation...</p>
            </div> :
        // Messages
        <>
              {displayMessages.map(message => <div key={message.id} className={cn("flex gap-3 animate-fade-in", message.isUser ? "justify-end" : "justify-start")}>
                  {!message.isUser && <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src="/elma-logo.png" alt="ELMA" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>}

                  <div className={cn("max-w-[80%] space-y-2", message.isUser ? "items-end" : "items-start")}>
                    <Card className={cn("p-4 transition-all duration-200", message.isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted")}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>

                      {message.source && <div className="mt-3 pt-3 border-t border-border/20">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpen className="w-3 h-3" />
                            <span>Source: {message.source.reference || message.source}</span>
                          </div>
                        </div>}
                    </Card>

                    {!message.isUser && <div className="flex items-center gap-1">
                      <Button aria-label={isPlayingAudio || isAutoSpeaking ? 'Pause speech' : 'Play speech'} variant="ghost" size="sm" onClick={() => handleSpeakMessage(message.text)} className="h-6 px-2 text-xs">
                        {(isPlayingAudio || isAutoSpeaking) ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button aria-label="Copy message" variant="ghost" size="sm" onClick={() => copyToClipboard(message.text)} className="h-6 px-2 text-xs">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button aria-label={isBookmarked(message.id) ? 'Remove bookmark' : 'Add bookmark'} variant="ghost" size="sm" onClick={() => addBookmark(message.id, message.text.substring(0, 50))} className="h-6 px-2 text-xs">
                        <Bookmark className={cn("w-3 h-3", isBookmarked(message.id) && "fill-current text-primary")} />
                      </Button>
                      </div>}

                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.isUser && <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {profile?.display_name?.[0]?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>}
                </div>)}

              {/* Processing indicator */}
              {isProcessing && <div className="flex gap-3 animate-fade-in justify-start">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src="/elma-logo.png" alt="ELMA" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>

                  <div className="max-w-[80%] space-y-2 items-start">
                    <Card className="p-4 transition-all duration-200 bg-muted animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{
                      animationDelay: '0.1s'
                    }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{
                      animationDelay: '0.2s'
                    }}></div>
                        </div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                </div>}
            </>}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Minimal Voice Mode Interface */}
      {currentMode && (
        <div className="border-t border-border/5 bg-background/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto p-8">
            {currentMode === 'dictation' ? (
              <PremiumDictationInterface 
                onTranscriptComplete={handleDictationComplete} 
                className="w-full" 
              />
            ) : currentMode === 'live' ? (
              <PremiumLiveConversationInterface 
                onTranscriptStream={handleLiveTranscriptStream} 
                onInterrupt={handleLiveInterrupt}
                conversationState={conversationState}
                className="w-full" 
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Refined Input Area */}
      <div className="border-t border-border/20 bg-background/95 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Container with Enhanced Visual Hierarchy */}
            <div className="relative">
              <div className="flex gap-3 items-end p-4 rounded-3xl border border-border/30 bg-background/80 backdrop-blur-sm transition-all duration-300 focus-within:border-primary/40 focus-within:bg-background/90 focus-within:shadow-lg focus-within:shadow-primary/10">
                {/* Input Field */}
                <div className="flex-1 relative">
                    <Textarea 
                      ref={textareaRef} 
                      value={inputValue} 
                      onChange={e => setInputValue(e.target.value)} 
                      onKeyDown={handleKeyDown} 
                      placeholder={t('chat.placeholder')}
                      lang={language}
                      dir={languageInfo.rtl ? 'rtl' : 'ltr'}
                      className="min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent px-0 py-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 text-sm leading-relaxed" 
                      disabled={isProcessing} 
                    />
                  
                  {/* Character count - Subtle */}
                  {inputValue.length > 100 && (
                    <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground/40">
                      {inputValue.length}
                    </div>
                  )}
                </div>

                {/* Button Group - Voice modes + Send */}
                <div className="flex items-center gap-2">
                  {/* Voice Mode Buttons */}
                  <div className="flex gap-1 p-1 rounded-2xl bg-muted/20 backdrop-blur-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode(currentMode === 'dictation' ? null : 'dictation')}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        currentMode === 'dictation' 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
                      )}
                      disabled={isProcessing}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode(currentMode === 'live' ? null : 'live')}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        currentMode === 'live' 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
                      )}
                      disabled={isProcessing}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-7 bg-border/40 mx-1" />

                  {/* Send Button */}
                  <Button 
                    type="submit" 
                    disabled={!inputValue.trim() || isProcessing} 
                    size="sm" 
                    className={cn(
                      "h-11 w-11 rounded-2xl transition-all duration-300",
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      "shadow-md hover:shadow-lg hover:shadow-primary/20",
                      "hover:scale-105 active:scale-95",
                      !inputValue.trim() && "scale-95 opacity-60"
                    )}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/60 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Status - Ultra Minimal */}
            {currentMode && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    currentMode === 'dictation' ? "bg-primary animate-pulse" : "bg-accent animate-pulse"
                  )} />
                  <span>{currentMode === 'dictation' ? 'Memo' : 'Live'} mode</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>;
};