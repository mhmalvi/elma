import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FloatingVoiceButton } from '@/components/ui/floating-voice-button';
import { Send, Mic, Play, Pause, Copy, Share, Bookmark, MoreHorizontal, Sparkles, MessageCircle, BookOpen, Quote } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useRealtimeVoiceChat } from '@/hooks/useRealtimeVoiceChat';
import { useStreamingTTS } from '@/hooks/useStreamingTTS';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

interface ConversationInterfaceProps {
  className?: string;
}

export const ConversationInterface = ({ className }: ConversationInterfaceProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addBookmark, isBookmarked } = useBookmarks();
  const { toast } = useToast();
  const { currentMode, settings, setMode } = useVoiceMode();

  // Use conversation management context
  const {
    currentConversation,
    messages: conversationMessages,
    createConversation,
    addMessage,
    messagesLoading,
  } = useConversationsContext();

  // Real-time voice chat system
  const {
    chatState,
    toggleConversation,
    interrupt,
    changeLanguage,
    sendTextMessage
  } = useRealtimeVoiceChat(user?.id);

  // Streaming TTS for immediate response
  const {
    streamState,
    isStreaming: isTTSStreaming,
    startStreamingResponse,
    stopStreaming
  } = useStreamingTTS();

  // Voice input for manual control
  const { sttState, startListening, stopListening, clearTranscript } = useAdvancedVoiceSTT();

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  // Handle voice transcript for manual mode
  useEffect(() => {
    if (sttState.transcript && sttState.transcript !== sttState.interimTranscript && currentMode !== 'voice') {
      setInputValue(sttState.transcript);
      if (settings.autoTTS) {
        sendMessage(sttState.transcript);
      }
      clearTranscript();
    } else if (sttState.interimTranscript && currentMode !== 'voice') {
      setInputValue(sttState.interimTranscript);
    }
  }, [sttState.transcript, sttState.interimTranscript, settings.autoTTS, clearTranscript, currentMode]);

  // Send message to AI
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;
    
    setInputValue('');
    setIsProcessing(true);
    
    try {
      // Create conversation if none exists
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await createConversation(messageText.substring(0, 100));
        if (!conversation) {
          throw new Error('Failed to create conversation');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add user message immediately
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

      // Get AI response
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          question: messageText,
          user_id: user?.id,
          conversation_id: conversation.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      // Add AI response
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

        // Auto-speak AI response with streaming TTS for immediate response
        const responseText = data.answer || data.response;
        if (responseText && (currentMode === 'voice' || settings.autoTTS)) {
          // Stop any current streaming
          stopStreaming();
          
          // Start streaming TTS immediately - no delay
          await startStreamingResponse(responseText, settings.language);
          
          // Note: Auto-resume listening is handled by useRealtimeVoiceChat hook
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
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

  const toggleVoiceMode = async () => {
    if (currentMode === 'voice') {
      // Stop real-time voice chat
      await toggleConversation();
      
      // Switch to text mode
      setMode('text');
      
      // Also stop manual voice if active
      if (sttState.isListening) {
        stopListening();
      }
    } else {
      // Switch to voice mode
      setMode('voice');
      
      // Start real-time voice conversation
      await toggleConversation();
    }
  };

  const handleSpeakMessage = async (text: string) => {
    if (isTTSStreaming || streamState.isStreaming) {
      stopStreaming();
    } else {
      await startStreamingResponse(text, settings.language);
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

  const welcomePrompts = [
    "What does Islam teach about patience?",
    "Can you explain the concept of Tawhid?",
    "What are the pillars of Islam?",
    "Tell me about the importance of prayer in Islam"
  ];

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {displayMessages.length === 0 && !currentConversation && !messagesLoading ? (
            // Welcome State
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to AirChatBot</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your Islamic AI companion for authentic guidance from Quran and Hadith. 
                  Ask anything about Islamic teachings, life advice, or spiritual growth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">Real-time Conversation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Natural chat experience with instant responses
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
                  {welcomePrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(prompt)}
                      className="text-xs hover:bg-primary/10"
                      disabled={isProcessing}
                    >
                      <Quote className="w-3 h-3 mr-1" />
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : messagesLoading ? (
            // Loading state
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading conversation...</p>
            </div>
          ) : (
            // Messages
            <>
              {displayMessages.map(message => (
                <div key={message.id} className={cn("flex gap-3 animate-fade-in", message.isUser ? "justify-end" : "justify-start")}>
                  {!message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src="/src/assets/airchatbot-logo.png" alt="AirChatBot" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn("max-w-[80%] space-y-2", message.isUser ? "items-end" : "items-start")}>
                    <Card className={cn(
                      "p-4 transition-all duration-200",
                      message.isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                    )}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>

                      {message.source && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpen className="w-3 h-3" />
                            <span>Source: {message.source.reference || message.source}</span>
                          </div>
                        </div>
                      )}
                    </Card>

                    {!message.isUser && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpeakMessage(message.text)}
                          className="h-6 px-2 text-xs"
                        >
                          {(isTTSStreaming || streamState.isStreaming) ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.text)}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addBookmark(message.id, message.text.substring(0, 50))}
                          className="h-6 px-2 text-xs"
                        >
                          <Bookmark className={cn("w-3 h-3", isBookmarked(message.id) && "fill-current text-primary")} />
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {profile?.display_name?.[0]?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex gap-3 animate-fade-in justify-start">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src="/src/assets/airchatbot-logo.png" alt="AirChatBot" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>

                  <div className="max-w-[80%] space-y-2 items-start">
                    <Card className="p-4 transition-all duration-200 bg-muted animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/10 bg-background/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentMode === 'voice' ? "Voice mode active - speak naturally" : "Ask about Islamic teachings, life advice, or spiritual guidance..."}
                  className={cn(
                    "min-h-[48px] max-h-[120px] resize-none pr-20 text-sm",
                    "bg-background/50 border-border/50 focus:border-primary/50",
                    currentMode === 'voice' && "border-green-400/50 bg-green-50/50"
                  )}
                  disabled={isProcessing || currentMode === 'voice'}
                  rows={1}
                />
                
                {/* Voice status indicator */}
                {currentMode === 'voice' && (
                  <div className="absolute right-14 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        chatState.conversationState === 'listening' && "bg-green-500 animate-pulse",
                        chatState.conversationState === 'processing' && "bg-yellow-500 animate-spin",
                        chatState.conversationState === 'speaking' && "bg-blue-500 animate-bounce"
                      )}></div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {chatState.conversationState}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice toggle button */}
              <Button
                type="button"
                onClick={toggleVoiceMode}
                variant="outline"
                size="icon"
                className={cn(
                  "h-12 w-12 shrink-0 transition-all duration-200",
                  currentMode === 'voice' && "bg-green-500 hover:bg-green-600 text-white border-green-500"
                )}
              >
                <Mic className={cn("w-5 h-5", currentMode === 'voice' && "animate-pulse")} />
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="h-12 w-12 shrink-0"
                size="icon"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};