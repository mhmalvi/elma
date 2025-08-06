import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, Mic, BookOpen, Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import airchatbotLogo from "@/assets/airchatbot-logo.png"

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen subtle-gradient">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <img 
              src={airchatbotLogo} 
              alt="AirChatBot Logo" 
              className="w-24 h-24 mx-auto rounded-3xl shadow-spiritual"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            AirChatBot
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ask with your voice.<br />
            Learn with your heart.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <Card className="p-4 shadow-soft border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 primary-gradient rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Voice First</h3>
                <p className="text-sm text-muted-foreground">Speak naturally, get instant answers</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 spiritual-gradient rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Authentic Sources</h3>
                <p className="text-sm text-muted-foreground">Quran, Hadith & verified Islamic knowledge</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-spiritual rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Warm & Caring</h3>
                <p className="text-sm text-muted-foreground">Respectful, compassionate responses</p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/chat')}
            size="lg"
            className="w-full h-14 text-lg primary-gradient shadow-spiritual"
          >
            <MessageCircle className="w-6 h-6 mr-2" />
            Start Chat
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Try saying:
            </p>
            <p className="text-sm italic text-primary">
              "What does the Quran say about patience?"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Seeking knowledge is the duty of every Muslim
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home