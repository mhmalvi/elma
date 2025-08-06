import { useState, useRef, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { FuturisticButton } from "@/components/ui/futuristic-button"
import { FuturisticCard } from "@/components/ui/futuristic-card"
import { LoadingDots } from "@/components/ui/loading-dots"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useVoiceChat } from "@/hooks/useVoiceChat"
import { useConversations } from "@/hooks/useConversations"
import { ConversationSidebar } from "@/components/chat/ConversationSidebar"
import { EnhancedChatBubble } from "@/components/chat/EnhancedChatBubble"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatInput } from "@/components/chat/ChatInput"
import { GlobalSearch } from "@/components/search/GlobalSearch"
import { ExportDialog } from "@/components/export/ExportDialog"
import { FloatingVoiceButton } from "@/components/ui/floating-voice-button"
import { supabase } from "@/integrations/supabase/client"
import { cn } from "@/lib/utils"
import { MessageCircle, Sparkles, BookOpen, Settings } from "lucide-react"

const Chat = () => {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  
  const {
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopListening,
  } = useVoiceChat()

  const {
    currentConversation,
    messages,
    messagesLoading,
    createConversation,
    addMessage
  } = useConversations()
  
  const [textInput, setTextInput] = useState("")
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update text input when voice transcript changes
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setTextInput(transcript)
    }
  }, [transcript])

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingDots />
      </div>
    )
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    setIsResponding(true)
    
    try {
      // Create conversation if needed
      let conversationId = currentConversation?.id
      if (!conversationId) {
        const newConversation = await createConversation(
          messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
          messageText
        )
        conversationId = newConversation?.id
      }

      // Call AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          question: messageText,
          conversationId
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error || 'Failed to get AI response')

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsResponding(false)
    }
  }

  const handleVoiceMode = () => {
    setShowVoiceMode(!showVoiceMode)
    if (!showVoiceMode) {
      startListening()
    } else {
      stopListening()
    }
  }

  const handleBookmark = async (messageId: string) => {
    // Bookmark functionality handled by the chat bubble component
    toast({
      title: "Bookmark saved",
      description: "Message has been bookmarked"
    })
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 grid-pattern" />
      </div>

      {/* Header */}
      <ChatHeader
        isVoiceMode={showVoiceMode}
        onMenuClick={() => setSidebarOpen(true)}
        onSearchClick={() => setShowSearch(true)}
        onExportClick={() => setShowExport(true)}
        onSettingsClick={() => {}}
        onVoiceModeToggle={() => setShowVoiceMode(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80 glass border-r border-border/20">
            <ConversationSidebar />
          </SheetContent>
        </Sheet>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Messages */}
          <ScrollArea 
            ref={chatContainerRef}
            className="flex-1 px-6 py-8 lg:px-8"
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingDots />
              </div>
            ) : !hasMessages ? (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8">
                {/* Welcome Card */}
                <FuturisticCard variant="glass" className="p-8 w-full">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-glow">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold text-foreground">
                        Welcome to AirChatBot
                      </h3>
                      <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                        Your Islamic AI companion for authentic guidance from Quran and Hadith. 
                        Ask anything about Islamic teachings, life advice, or spiritual growth.
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <Sparkles className="w-5 h-5 text-primary mb-2" />
                        <h4 className="font-medium text-sm text-foreground mb-1">Voice First</h4>
                        <p className="text-xs text-muted-foreground">Speak naturally and get instant responses</p>
                      </div>
                      <div className="p-4 bg-spiritual/5 rounded-xl border border-spiritual/10">
                        <BookOpen className="w-5 h-5 text-spiritual mb-2" />
                        <h4 className="font-medium text-sm text-foreground mb-1">Authentic Sources</h4>
                        <p className="text-xs text-muted-foreground">All answers from verified Islamic texts</p>
                      </div>
                    </div>
                  </div>
                </FuturisticCard>

                {/* Example Prompts */}
                <FuturisticCard variant="minimal" className="p-6 w-full">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                    Try these example questions:
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "What does Islam teach about patience?",
                      "How do I strengthen my relationship with Allah?",
                      "What are the benefits of regular prayer?"
                    ].map((example, index) => (
                      <FuturisticButton
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setTextInput(example)}
                        className="justify-start text-left h-auto p-4 text-sm border-dashed hover:border-primary/50 hover:bg-primary/5"
                      >
                        <MessageCircle className="w-4 h-4 mr-3 flex-shrink-0 text-primary" />
                        {example}
                      </FuturisticButton>
                    ))}
                  </div>
                </FuturisticCard>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <EnhancedChatBubble
                    key={message.id}
                    message={message}
                    onBookmark={handleBookmark}
                    isBookmarked={false} // TODO: Check if message is bookmarked
                  />
                ))}
                
                {/* Loading indicator for AI response */}
                {isResponding && (
                  <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-spiritual/10 flex items-center justify-center shadow-glow">
                        <span className="text-sm font-medium text-spiritual">AI</span>
                      </div>
                      <FuturisticCard variant="glass" className="p-6 max-w-[85%]">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-6 bg-primary rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-sm">Searching Islamic sources...</span>
                        </div>
                      </FuturisticCard>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Voice Mode Overlay */}
          {showVoiceMode && (
            <div className="absolute inset-0 glass backdrop-blur-xl flex items-center justify-center z-40">
              <div className="text-center space-y-8 max-w-md mx-auto p-8">
                <FloatingVoiceButton
                  isRecording={isListening}
                  isLoading={isProcessing}
                  transcript={transcript}
                  onStartRecording={startListening}
                  onStopRecording={stopListening}
                />
                
                {transcript && (
                  <div className="space-y-4">
                    <FuturisticCard variant="glass" className="p-4">
                      <p className="text-sm text-foreground">"{transcript}"</p>
                    </FuturisticCard>
                    <FuturisticButton
                      onClick={() => {
                        handleSendMessage(transcript)
                        setShowVoiceMode(false)
                      }}
                      variant="neon"
                      size="lg"
                      disabled={!transcript.trim()}
                      className="w-full"
                    >
                      Send Message
                    </FuturisticButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showVoiceMode && (
            <ChatInput
              value={textInput}
              onChange={setTextInput}
              onSend={handleSendMessage}
              onVoiceStart={handleVoiceMode}
              isListening={isListening}
              isProcessing={isProcessing || isResponding}
              disabled={isResponding}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <GlobalSearch
        open={showSearch}
        onOpenChange={setShowSearch}
      />

      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
      />
    </div>
  )
}

export default Chat