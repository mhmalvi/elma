import { useState, useRef, useEffect } from "react"
import { Send, Volume2, VolumeX, Pause, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { LoadingDots } from "@/components/ui/loading-dots"
import { FloatingVoiceButton } from "@/components/ui/floating-voice-button"
import { TopAppBar } from "@/components/ui/top-app-bar"
import { ModernCard } from "@/components/ui/modern-card"
import { useToast } from "@/hooks/use-toast"
import { useVoiceChat } from "@/hooks/useVoiceChat"

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  source?: {
    verse?: string;
    hadith?: string;
    reference?: string;
  };
}

const welcomeMessage: ChatMessage = {
  id: '1',
  text: "Assalamu Alaikum! I'm here to help you learn from the Quran and Hadith. You can speak to me or type your questions.",
  isUser: false,
  source: {
    reference: "Welcome message"
  }
}

const Chat = () => {
  const { toast } = useToast()
  const {
    messages,
    isListening,
    isProcessing,
    transcript,
    isSpeaking,
    isPaused,
    startListening,
    stopListening,
    sendTextMessage,
    speakText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    clearMessages
  } = useVoiceChat()
  
  const [textInput, setTextInput] = useState("")
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([welcomeMessage])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Combine welcome message with chat messages
  useEffect(() => {
    setAllMessages([welcomeMessage, ...messages])
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [allMessages])

  const handleStartRecording = () => {
    setShowVoiceMode(true)
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
    setTimeout(() => setShowVoiceMode(false), 500)
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      sendTextMessage(textInput)
      setTextInput("")
    }
  }

  const handleExplainMore = (messageId: string) => {
    sendTextMessage("Please explain more about this")
  }

  const handleBookmark = (messageId: string) => {
    toast({
      title: "Saved to bookmarks",
      description: "You can find this in your bookmarks section"
    })
  }

  const handleToggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking()
      toast({
        title: "Speech stopped",
        description: "Voice playback has been stopped"
      })
    } else {
      toast({
        title: "No active speech",
        description: "No voice is currently playing"
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background pb-20">
      {/* Modern App Bar */}
      <TopAppBar
        title="AirChatBot"
        transparent
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAudio}
            className="rounded-full"
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        }
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 scroll-smooth">
        {allMessages.map((message, index) => (
          <div
            key={message.id}
            className="animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ChatBubble
              message={message.text}
              isUser={message.isUser}
              audioUrl={undefined}
              source={message.source}
              onExplainMore={() => handleExplainMore(message.id)}
              onBookmark={() => handleBookmark(message.id)}
            />
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
            <ModernCard className="p-4 mr-4 bg-card/50 backdrop-blur-sm" hover={false}>
              <LoadingDots />
            </ModernCard>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Speech Control Bar */}
      {isSpeaking && (
        <div className="fixed top-16 left-4 right-4 z-40 animate-in slide-in-from-top duration-300">
          <ModernCard className="p-3 bg-card/90 backdrop-blur-md border border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground truncate">
                  {isPaused ? "Speech Paused" : "Speaking..."}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resumeSpeaking}
                    className="w-8 h-8 p-0 hover:bg-primary/10"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={pauseSpeaking}
                    className="w-8 h-8 p-0 hover:bg-primary/10"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={stopSpeaking}
                  className="w-8 h-8 p-0 hover:bg-destructive/10 text-destructive"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}

      {/* Voice Mode Overlay */}
      {showVoiceMode && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-semibold text-foreground">
                {isListening ? "Listening..." : isProcessing ? "Processing..." : "Ready"}
              </h2>
              {transcript && (
                <ModernCard className="p-4 max-w-sm mx-auto" hover={false}>
                  <p className="text-muted-foreground italic">
                    "{transcript}"
                  </p>
                </ModernCard>
              )}
            </div>
            
            <FloatingVoiceButton
              isRecording={isListening}
              isLoading={isProcessing}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          </div>
        </div>
      )}

      {/* Text Input (always visible) */}
      <div className="sticky bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="max-w-md mx-auto space-y-4">
          {/* Quick Text Input */}
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-full bg-muted/50 border-none focus:bg-background transition-colors"
              disabled={isProcessing}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!textInput.trim() || isProcessing}
              className="rounded-full w-10 h-10 p-0 primary-gradient"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Voice Trigger */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowVoiceMode(true)}
              disabled={isProcessing}
              variant="outline"
              className="rounded-full px-6 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Speak to ask
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat