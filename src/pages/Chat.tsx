import { useState, useRef, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { Send, Volume2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingDots } from "@/components/ui/loading-dots"
import { FloatingVoiceButton } from "@/components/ui/floating-voice-button"
import { TopAppBar } from "@/components/ui/top-app-bar"
import { ModernCard } from "@/components/ui/modern-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useVoiceChat } from "@/hooks/useVoiceChat"
import { useConversations } from "@/hooks/useConversations"
import { ConversationSidebar } from "@/components/chat/ConversationSidebar"
import { EnhancedChatBubble } from "@/components/chat/EnhancedChatBubble"
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Redirect if not authenticated - moved after all hooks
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    )
  }


  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

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
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !isProcessing) {
      handleSendMessage(textInput)
      setTextInput("")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 border-r border-border/50",
        sidebarOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        <ConversationSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TopAppBar
          title={currentConversation?.title || "New Conversation"}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          }
        />

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <h3 className="text-lg font-semibold mb-2">Welcome to AirChatBot</h3>
                <p className="text-muted-foreground mb-6">
                  Ask any question about Islam and get authentic answers.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <EnhancedChatBubble key={message.id} message={message} />
              ))
            )}
            
            {isProcessing && (
              <div className="flex justify-start">
                <ModernCard className="p-4 mr-8">
                  <LoadingDots />
                </ModernCard>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleTextSubmit} className="flex gap-3">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask a question about Islam..."
              className="flex-1"
              disabled={isProcessing}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVoiceMode(true)}
              disabled={isProcessing}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="primary-gradient"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Voice Mode Overlay */}
      {showVoiceMode && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-semibold">
              {isListening ? "Listening..." : "Ready"}
            </h2>
            {transcript && (
              <ModernCard className="p-4 max-w-md mx-auto">
                <p className="italic">"{transcript}"</p>
              </ModernCard>
            )}
            <FloatingVoiceButton
              isRecording={isListening}
              isLoading={isProcessing}
              transcript={transcript}
              onStartRecording={startListening}
              onStopRecording={stopListening}
            />
            <Button variant="outline" onClick={() => setShowVoiceMode(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat