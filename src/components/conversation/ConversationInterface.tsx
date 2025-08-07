import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Play, Pause, Copy, Bookmark, Sparkles, MessageCircle, BookOpen, Quote, Square, MicOff, XIcon, HandIcon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useStreamingVoiceChat } from '@/hooks/useStreamingVoiceChat';
import { cn } from '@/lib/utils';

interface ConversationInterfaceProps {
  className?: string;
}

export const ConversationInterface = ({ className }: ConversationInterfaceProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addBookmark, isBookmarked } = useBookmarks();
  const { toast } = useToast();

  // Use the new streaming voice chat system
  const voiceChat = useStreamingVoiceChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [voiceChat.messages, scrollToBottom]);

  // Send message to AI
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Use the streaming voice chat system
    await voiceChat.sendTextMessage(messageText.trim());
    setInputValue('');
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

  const toggleVoiceMode = () => {
    voiceChat.toggleVoiceMode();
  };

  const handleSpeakMessage = async (text: string) => {
    await voiceChat.speakText?.(text);
  };

  const handleStopSpeaking = () => {
    voiceChat.interruptAI();
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

  // Voice mode status indicators
  const getVoiceStatus = () => {
    if (!voiceChat.isVoiceMode) return '';
    
    switch (voiceChat.state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'interrupted':
        return 'Interrupted';
      default:
        return 'Voice mode ready';
    }
  };

  const isVoiceActive = voiceChat.isVoiceMode;
  const showVoiceControls = voiceChat.isVoiceMode;

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
          {voiceChat.messages.length === 0 ? (
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
                      disabled={voiceChat.isProcessing}
                    >
                      <Quote className="w-3 h-3 mr-1" />
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <>
              {voiceChat.messages.map(message => (
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
                      {message.isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                      )}
                    </Card>

                    {!message.isUser && !message.isProcessing && (
                      <div className="flex items-center gap-2 relative z-10">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            console.log('UI: Play clicked for', message.id)
                            voiceChat.speakMessage(message.id)
                          }}
                          className="h-7 px-3 text-xs"
                          aria-label="Play message audio"
                          data-testid={`play-btn-${message.id}`}
                          disabled={voiceChat.playingMessageId === message.id && voiceChat.isSpeaking}
                        >
                          <Play className="w-3 h-3" />
                          <span className="ml-1">Play</span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            console.log('UI: Stop clicked for', message.id)
                            voiceChat.stopSpeaking()
                          }}
                          className="h-7 px-3 text-xs"
                          aria-label="Stop message audio"
                          data-testid={`stop-btn-${message.id}`}
                          disabled={voiceChat.playingMessageId !== message.id || !voiceChat.isSpeaking}
                        >
                          <Square className="w-3 h-3" />
                          <span className="ml-1">Stop</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(message.text)}
                          className="h-7 px-3 text-xs"
                          aria-label="Copy message"
                          data-testid={`copy-btn-${message.id}`}
                        >
                          <Copy className="w-3 h-3" />
                          <span className="ml-1">Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBookmark(message.id, message.text.substring(0, 50))}
                          className="h-7 px-3 text-xs"
                          aria-label={isBookmarked(message.id) ? "Remove bookmark" : "Bookmark message"}
                          data-testid={`bookmark-btn-${message.id}`}
                        >
                          <Bookmark className={cn("w-3 h-3", isBookmarked(message.id) && "fill-current text-primary")} />
                          <span className="ml-1">{isBookmarked(message.id) ? 'Bookmarked' : 'Bookmark'}</span>
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
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/10 bg-background/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voiceChat.isVoiceMode ? "Voice mode active - speak naturally" : "Ask about Islamic teachings, life advice, or spiritual guidance..."}
                  className={cn(
                    "min-h-[48px] max-h-[120px] resize-none pr-4 text-sm",
                    "bg-background/50 border-border/50 focus:border-primary/50",
                    voiceChat.isVoiceMode && "border-green-400/50 bg-green-50/50 dark:bg-green-950/20"
                  )}
                  disabled={voiceChat.isProcessing || voiceChat.isVoiceMode}
                  rows={1}
                />
              </div>

              {/* Voice Mode Toggle */}
              <Button
                type="button"
                variant={voiceChat.isVoiceMode ? "default" : "outline"}
                size="icon"
                onClick={toggleVoiceMode}
                className={cn(
                  "shrink-0 transition-all duration-200",
                  voiceChat.isVoiceMode && "bg-primary text-primary-foreground shadow-lg",
                  voiceChat.isListening && "animate-pulse"
                )}
              >
                {voiceChat.isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!inputValue.trim() || voiceChat.isProcessing}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* EMERGENCY Voice Mode Controls */}
        {showVoiceControls && (
          <div className="space-y-3 px-4 py-2 bg-muted/30 border-t border-border/50">
            {/* Emergency Controls Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Emergency Stop Button */}
              <Button
                onClick={voiceChat.emergencyStop}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <XIcon className="w-4 h-4 mr-2" />
                EMERGENCY STOP
              </Button>

              {/* System Reset Button */}
              {voiceChat.isSystemDisabled && (
                <Button
                  onClick={voiceChat.resetVoiceSystem}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  RESET SYSTEM
                </Button>
              )}

              {/* Push-to-Talk Mode */}
              {!voiceChat.isSystemDisabled && (
                <Button
                  onClick={voiceChat.switchToPushToTalk}
                  variant={voiceChat.systemState === 'push_to_talk' ? "default" : "outline"}
                  size="sm"
                >
                  <HandIcon className="w-4 h-4 mr-2" />
                  Push-to-Talk
                </Button>
              )}

              {/* Recovery for minor issues */}
              {voiceChat.error && !voiceChat.isSystemDisabled && (
                <Button
                  onClick={voiceChat.recoverVoiceMode}
                  variant="secondary"
                  size="sm"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Recover
                </Button>
              )}
            </div>

            {/* Status Row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  voiceChat.isSystemDisabled ? "bg-red-500" :
                  voiceChat.isListening ? "bg-green-500 animate-pulse" : 
                  voiceChat.isSpeaking ? "bg-blue-500 animate-pulse" :
                  voiceChat.isProcessing ? "bg-yellow-500 animate-pulse" : "bg-gray-400"
                )} />
                {voiceChat.isSystemDisabled ? `GLOBAL AUDIO MANAGER: DISABLED` : `${getVoiceStatus()} (${voiceChat.systemState})`}
              </div>
              
              {voiceChat.currentTranscript && !voiceChat.isSystemDisabled && (
                <div className="text-sm text-foreground/80 italic">
                  "{voiceChat.currentTranscript}"
                </div>
              )}

              {voiceChat.audioLevel > 0 && !voiceChat.isSystemDisabled && (
                <div className="flex items-center gap-1">
                  <div className="text-xs text-muted-foreground">Volume:</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1 h-3 rounded-full transition-colors",
                          voiceChat.audioLevel > (i + 1) * 0.2 ? "bg-green-500" : "bg-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {voiceChat.isSpeaking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStopSpeaking}
                  className="ml-auto"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            {/* Global Audio Manager Status */}
            {voiceChat.isSystemDisabled && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="text-sm text-destructive mb-2">
                  🚨 Global Audio Manager: System Disabled
                </div>
                <div className="text-xs text-muted-foreground">
                  All browser audio APIs have been locked to prevent infinite TTS loops. Click "RESET SYSTEM" to restart.
                </div>
              </div>
            )}
            
            {voiceChat.isVADDisabled && !voiceChat.isSystemDisabled && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="text-sm text-destructive mb-2">
                  🚨 Voice activity detection disabled due to feedback loop
                </div>
                <div className="text-xs text-muted-foreground">
                  Use emergency controls or wait for automatic recovery
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};