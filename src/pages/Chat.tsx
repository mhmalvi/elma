import { useState, useRef, useEffect } from "react"
import { Send, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { LoadingDots } from "@/components/ui/loading-dots"
import { FloatingVoiceButton } from "@/components/ui/floating-voice-button"
import { TopAppBar } from "@/components/ui/top-app-bar"
import { ModernCard } from "@/components/ui/modern-card"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  text: string
  isUser: boolean
  audioUrl?: string
  source?: {
    verse?: string
    hadith?: string
    reference?: string
  }
}

const welcomeMessage: Message = {
  id: '1',
  text: "Assalamu Alaikum! I'm here to help you learn from the Quran and Hadith. You can speak to me or type your questions.",
  isUser: false,
  source: {
    reference: "Welcome message"
  }
}

const Chat = () => {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [textInput, setTextInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartRecording = () => {
    if (!navigator.mediaDevices) {
      toast({
        title: "Microphone not available",
        description: "Please check your browser permissions",
        variant: "destructive"
      })
      return
    }
    
    setIsRecording(true)
    setTranscript("Listening...")
    setShowVoiceMode(true)
    
    // Simulate recording (replace with actual implementation)
    setTimeout(() => {
      setTranscript("What does Islam say about forgiveness?")
    }, 2000)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    if (transcript && transcript !== "Listening...") {
      handleSubmitMessage(transcript)
      setTranscript("")
    }
    setTimeout(() => setShowVoiceMode(false), 500)
  }

  const handleSubmitMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])
    setTextInput("")
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "In Islam, forgiveness is highly valued. Allah says in the Quran: 'But whoever forgives and makes reconciliation, his reward is with Allah.' Forgiveness brings us closer to righteousness and earns Allah's mercy.",
        isUser: false,
        source: {
          verse: "Ash-Shura 42:40",
          hadith: "Sahih Bukhari 6853",
          reference: "The virtue of forgiveness in Islam"
        }
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 2000)
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmitMessage(textInput)
  }

  const handleExplainMore = (messageId: string) => {
    handleSubmitMessage("Explain more about this")
  }

  const handleBookmark = (messageId: string) => {
    toast({
      title: "Saved to bookmarks",
      description: "You can find this in your bookmarks section"
    })
  }

  const handleToggleAudio = () => {
    // Toggle audio playback for all messages
    toast({
      title: "Audio toggled",
      description: "Voice responses have been toggled"
    })
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
        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ChatBubble
              message={message.text}
              isUser={message.isUser}
              audioUrl={message.audioUrl}
              source={message.source}
              onExplainMore={() => handleExplainMore(message.id)}
              onBookmark={() => handleBookmark(message.id)}
            />
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
            <ModernCard className="p-4 mr-4 bg-card/50 backdrop-blur-sm" hover={false}>
              <LoadingDots />
            </ModernCard>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Mode Overlay */}
      {showVoiceMode && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-semibold text-foreground">
                {isRecording ? "Listening..." : "Processing..."}
              </h2>
              {transcript && transcript !== "Listening..." && (
                <ModernCard className="p-4 max-w-sm mx-auto" hover={false}>
                  <p className="text-muted-foreground italic">
                    "{transcript}"
                  </p>
                </ModernCard>
              )}
            </div>
            
            <FloatingVoiceButton
              isRecording={isRecording}
              isLoading={isLoading}
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
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!textInput.trim() || isLoading}
              className="rounded-full w-10 h-10 p-0 primary-gradient"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Voice Trigger */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowVoiceMode(true)}
              disabled={isLoading}
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