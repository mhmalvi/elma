import { Button } from "@/components/ui/button"
import { MessageCircle, Mic, BookOpen, Heart, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ModernCard, FeatureCard, AnimatedCard } from "@/components/ui/modern-card"
import { FloatingParticles, DailyVerse } from "@/components/ui/decorative-elements"
import airchatbotLogo from "@/assets/airchatbot-logo.png"

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen subtle-gradient relative overflow-hidden">
      <FloatingParticles />
      
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10 pb-24">
        {/* Hero Section */}
        <AnimatedCard className="text-center mb-8">
          <div className="mb-8">
            <div className="relative inline-block">
              <img 
                src={airchatbotLogo} 
                alt="AirChatBot Logo" 
                className="w-28 h-28 mx-auto rounded-3xl shadow-floating glow-pulse"
              />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-spiritual animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-display font-bold text-foreground mb-4 leading-tight">
            AirChatBot
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Ask with your voice.<br />
            <span className="text-primary font-medium">Learn with your heart.</span>
          </p>
        </AnimatedCard>

        {/* Daily Verse */}
        <AnimatedCard delay={200} className="mb-8">
          <DailyVerse
            verse="And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose."
            reference="Quran 65:3"
          />
        </AnimatedCard>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <AnimatedCard delay={400}>
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice First"
              description="Speak naturally and get instant, authentic answers from Islamic sources"
              gradient="primary"
            />
          </AnimatedCard>

          <AnimatedCard delay={600}>
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Authentic Sources"
              description="Every answer is grounded in the Quran, Hadith, and verified Islamic scholarship"
              gradient="spiritual"
            />
          </AnimatedCard>

          <AnimatedCard delay={800}>
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Warm & Caring"
              description="Respectful, compassionate responses that honor the beauty of Islamic teachings"
              gradient="calm"
            />
          </AnimatedCard>
        </div>

        {/* CTA */}
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
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Try saying:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "\"What is patience in Islam?\"",
                  "\"Tell me about prayer\"",
                  "\"How do I find peace?\""
                ].map((example, index) => (
                  <span 
                    key={index}
                    className="inline-block px-3 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          </ModernCard>
        </AnimatedCard>

        {/* Inspirational Footer */}
        <AnimatedCard delay={1200} className="mt-12 text-center">
          <p className="text-sm text-muted-foreground italic">
            "Seeking knowledge is the duty of every Muslim"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            — Prophet Muhammad (PBUH)
          </p>
        </AnimatedCard>
      </div>
    </div>
  )
}

export default Home