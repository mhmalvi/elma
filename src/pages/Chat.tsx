import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceButton } from "@/components/ui/voice-button"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { LoadingDots } from "@/components/ui/loading-dots"
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

const Chat = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Assalamu Alaikum! I'm here to help you learn from the Quran and Hadith. You can speak to me or type your questions.",
      isUser: false,
      source: {
        reference: "Welcome message"
      }
    }
  ])
  const [textInput, setTextInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">AirChatBot</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/settings')}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            audioUrl={message.audioUrl}
            source={message.source}
            onExplainMore={() => handleExplainMore(message.id)}
            onBookmark={() => handleBookmark(message.id)}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card p-4 rounded-lg shadow-soft mr-4">
              <LoadingDots />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Transcript */}
      {transcript && (
        <div className="px-4 py-2 bg-muted/50">
          <p className="text-sm text-muted-foreground italic">
            {transcript}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1"
              disabled={isLoading || isRecording}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!textInput.trim() || isLoading || isRecording}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Voice Button */}
          <VoiceButton
            isRecording={isRecording}
            isLoading={isLoading}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Speak naturally or type your questions about Islam
        </p>
      </div>
    </div>
  )
}

export default Chat