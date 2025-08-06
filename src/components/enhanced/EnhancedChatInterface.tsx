import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Mic, 
  Square, 
  Volume2, 
  VolumeX, 
  Copy, 
  Share,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  MessageCircle,
  BookOpen,
  Quote
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';
import { useConversationsContext } from '@/contexts/ConversationsContext';
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

interface EnhancedChatInterfaceProps {
  className?: string;
}

export const EnhancedChatInterface = ({ className }: EnhancedChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
    isRecording,
    isProcessingVoice,
    isPlayingAudio,
    transcript,
    startRecording,
    stopRecording,
    speakText,
    stopAudio,
    setTranscript
  } = useVoiceIntegration();

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  // Handle transcript from voice input
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setInputValue(transcript);
      setTranscript(''); // Clear transcript after using it
    }
  }, [transcript, setTranscript]);

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
      }

      console.log('Sending message to AI for conversation:', conversation.id);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          question: messageText,
          user_id: user?.id,
          conversation_id: conversation.id
        }
      });

      if (error) {
        console.error('AI chat error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      console.log('AI response received:', data);
      console.log('AI response structure:', JSON.stringify(data, null, 2));

      // Auto-speak the response if voice mode is active
      if (isListening && data.answer) {
        await speakText(data.answer);
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

  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
      setIsListening(false);
    } else {
      setIsListening(true);
      await startRecording();
    }
  };

  const handleSpeakMessage = async (text: string) => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      await speakText(text);
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
              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-fade-in",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src="/src/assets/airchatbot-logo.png" alt="AirChatBot" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn(
                    "max-w-[80%] space-y-2",
                    message.isUser ? "items-end" : "items-start"
                  )}>
                    <Card className={cn(
                      "p-4 transition-all duration-200",
                      message.isUser 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
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
                          {isPlayingAudio ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
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
                          className="h-6 px-2 text-xs"
                        >
                          <Bookmark className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {user?.email?.charAt(0).toUpperCase()}
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

      {/* Voice Mode Indicator */}
      {isListening && (
        <div className="border-t bg-primary/5 p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Voice Mode Active</span>
            </div>
            {transcript && (
              <div className="text-sm text-muted-foreground">
                "{transcript}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background/80 backdrop-blur p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Islam, life guidance, Quran, Hadith..."
                className="min-h-[50px] max-h-[120px] resize-none pr-12 py-3"
                disabled={isProcessing}
              />
              
              {/* Voice button inside textarea */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                disabled={isProcessingVoice}
                className={cn(
                  "absolute right-2 top-2 h-8 w-8 p-0 transition-colors",
                  isRecording && "text-red-500",
                  isProcessingVoice && "animate-pulse"
                )}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="h-[50px] px-6"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">
              Press Enter to send • Shift+Enter for new line • Voice input available
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};