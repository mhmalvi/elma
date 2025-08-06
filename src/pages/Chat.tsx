import { useState, useRef, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingDots } from "@/components/ui/loading-dots"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
      {/* Header */}
      <ChatHeader
        isVoiceMode={showVoiceMode}
        onMenuClick={() => setSidebarOpen(true)}
        onSearchClick={() => setShowSearch(true)}
        onExportClick={() => setShowExport(true)}
        onVoiceModeToggle={() => setShowVoiceMode(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <ConversationSidebar />
          </SheetContent>
        </Sheet>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea 
            ref={chatContainerRef}
            className="flex-1 px-4 py-6"
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingDots />
              </div>
            ) : !hasMessages ? (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🕌</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Welcome to AirChatBot
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ask me anything about Islam, life guidance, Quran, or Hadith. 
                    I'm here to provide authentic answers from Islamic sources.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "What is patience in Islam?",
                    "Tell me about prayer",
                    "How do I find peace?"
                  ].map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTextInput(example)}
                      className="text-xs border-dashed hover:bg-primary/5"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 max-w-4xl mx-auto">
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
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-spiritual/10 flex items-center justify-center">
                      <span className="text-xs">AC</span>
                    </div>
                    <div className="bg-card rounded-2xl p-4 max-w-[85%]">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1 h-4 bg-primary rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                        Searching Islamic sources...
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Voice Mode Overlay */}
          {showVoiceMode && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="text-center space-y-6">
                <FloatingVoiceButton
                  isRecording={isListening}
                  isLoading={isProcessing}
                  transcript={transcript}
                  onStartRecording={startListening}
                  onStopRecording={stopListening}
                />
                
                {transcript && (
                  <div className="max-w-sm mx-auto">
                    <Button
                      onClick={() => {
                        handleSendMessage(transcript)
                        setShowVoiceMode(false)
                      }}
                      className="w-full primary-gradient"
                      disabled={!transcript.trim()}
                    >
                      Send Message
                    </Button>
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