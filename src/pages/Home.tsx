import { Button } from "@/components/ui/button"
import { MessageCircle, Mic, BookOpen, Heart, Sparkles, Shield, Users, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ModernCard, FeatureCard, AnimatedCard } from "@/components/ui/modern-card"
import airchatbotLogo from "@/assets/airchatbot-logo.png"

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-spiritual/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-accent/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10 pb-24">
        {/* Hero Section */}
        <AnimatedCard className="text-center mb-8">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl animate-pulse"></div>
              <img 
                src={airchatbotLogo} 
                alt="AirChatBot Logo" 
                className="relative w-28 h-28 mx-auto rounded-3xl shadow-floating"
              />
              <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            AirChatBot
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Your Islamic AI companion.<br />
            <span className="text-primary font-medium">Speak. Learn. Grow.</span>
          </p>
        </AnimatedCard>

        {/* Daily Verse Card */}
        <AnimatedCard delay={200} className="mb-8">
          <ModernCard className="p-6 bg-gradient-to-r from-primary/5 to-spiritual/5 border-primary/20">
            <div className="text-center">
              <div className="mb-4">
                <BookOpen className="w-6 h-6 text-primary mx-auto" />
              </div>
              <blockquote className="text-sm font-medium text-foreground mb-3 italic">
                "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose."
              </blockquote>
              <cite className="text-xs text-primary font-semibold">
                — Quran 65:3
              </cite>
            </div>
          </ModernCard>
        </AnimatedCard>

        {/* Features Grid */}
        <div className="space-y-4 mb-8">
          <AnimatedCard delay={400}>
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice First Experience"
              description="Speak naturally and get instant, authentic answers from Islamic sources with advanced speech recognition"
              gradient="primary"
            />
          </AnimatedCard>

          <AnimatedCard delay={600}>
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Authentic Sources"
              description="Every answer grounded in Quran, Hadith, and verified Islamic scholarship with proper citations"
              gradient="spiritual"
            />
          </AnimatedCard>

          <AnimatedCard delay={800}>
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Compassionate AI"
              description="Respectful, caring responses that honor the beauty and wisdom of Islamic teachings"
              gradient="calm"
            />
          </AnimatedCard>
        </div>

        {/* Stats Row */}
        <AnimatedCard delay={900} className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
              <Users className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold text-foreground">1000+</div>
              <div className="text-xs text-muted-foreground">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-spiritual/5 rounded-xl border border-spiritual/10">
              <Zap className="w-5 h-5 text-spiritual mx-auto mb-2" />
              <div className="text-lg font-bold text-foreground">24/7</div>
              <div className="text-xs text-muted-foreground">Always Available</div>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-xl border border-accent/10">
              <BookOpen className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-lg font-bold text-foreground">100%</div>
              <div className="text-xs text-muted-foreground">Authentic Sources</div>
            </div>
          </div>
        </AnimatedCard>

        {/* CTA Section */}
        <AnimatedCard delay={1000} className="space-y-6">
          <Button
            onClick={() => navigate('/chat')}
            size="lg"
            className="w-full h-16 text-lg font-semibold primary-gradient shadow-floating hover:shadow-large transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
          >
            <MessageCircle className="w-6 h-6 mr-3" />
            Start Your Journey
          </Button>
          
          <ModernCard className="p-4 bg-muted/30 border-dashed" hover={false}>
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Try asking:
              </p>
              <div className="space-y-2">
                {[
                  "What is patience in Islam?",
                  "Tell me about prayer",
                  "How do I find peace?"
                ].map((example, index) => (
                  <div 
                    key={index}
                    className="bg-primary/10 text-primary rounded-lg p-2 text-xs font-medium border border-primary/20"
                  >
                    "{example}"
                  </div>
                ))}
              </div>
            </div>
          </ModernCard>
        </AnimatedCard>

        {/* Inspirational Footer */}
        <AnimatedCard delay={1200} className="mt-12 text-center">
          <div className="p-6 bg-gradient-to-r from-spiritual/10 to-primary/10 rounded-2xl border border-spiritual/20">
            <p className="text-sm font-medium text-foreground mb-2">
              "Seeking knowledge is the duty of every Muslim"
            </p>
            <p className="text-xs text-muted-foreground">
              — Prophet Muhammad (PBUH)
            </p>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}

export default Home