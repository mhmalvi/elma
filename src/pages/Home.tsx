import React from "react"
import { useNavigate } from "react-router-dom"
import { MessageCircle, Mic, BookOpen, Heart, Sparkles, Shield, Users, Zap, ArrowRight, Play, Bookmark, Search } from "lucide-react"
import { FuturisticButton } from "@/components/ui/futuristic-button"
import { FuturisticCard, FeatureCard, AnimatedCard } from "@/components/ui/futuristic-card"
import { Badge } from "@/components/ui/badge"
import airchatbotLogo from "@/assets/airchatbot-logo.png"

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-spiritual/15 rounded-full blur-2xl animate-pulse" />
        
        {/* Aurora gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-gradient opacity-70" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={airchatbotLogo} 
              alt="AirChatBot" 
              className="w-10 h-10 rounded-xl shadow-glow"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold neon-text">AirChatBot</h1>
            <p className="text-xs text-muted-foreground">Islamic AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FuturisticButton variant="ghost" size="sm">
            <Search className="w-4 h-4" />
            Search
          </FuturisticButton>
          <FuturisticButton 
            variant="neon" 
            size="sm"
            onClick={() => navigate('/chat')}
          >
            <MessageCircle className="w-4 h-4" />
            Get Started
          </FuturisticButton>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Main Hero */}
          <AnimatedCard className="text-center mb-20">
            <div className="mb-8">
              <Badge variant="secondary" className="mb-6 glass px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Powered by Advanced AI
              </Badge>
              
              <h1 className="text-6xl lg:text-8xl font-bold mb-6 leading-tight">
                Islamic AI
                <br />
                <span className="neon-text">Companion</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
                Experience the future of Islamic learning with voice-powered conversations, 
                authentic sources, and AI that understands your spiritual journey.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <FuturisticButton
                variant="neon"
                size="xl"
                onClick={() => navigate('/chat')}
                className="group"
              >
                <Play className="w-6 h-6 mr-3" />
                Start Conversation
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </FuturisticButton>
              
              <FuturisticButton
                variant="glass"
                size="xl"
                onClick={() => navigate('/bookmarks')}
              >
                <Bookmark className="w-6 h-6 mr-3" />
                View Bookmarks
              </FuturisticButton>
            </div>

            {/* Quick examples */}
            <FuturisticCard variant="glass" className="max-w-4xl mx-auto p-6">
              <div className="text-center space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Try saying:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    "What is patience in Islam?",
                    "Tell me about prayer",
                    "How do I find peace?"
                  ].map((example, index) => (
                    <div 
                      key={index}
                      className="glass rounded-lg p-3 text-sm font-medium border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                      onClick={() => navigate('/chat')}
                    >
                      "{example}"
                    </div>
                  ))}
                </div>
              </div>
            </FuturisticCard>
          </AnimatedCard>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <AnimatedCard delay={200}>
              <FeatureCard
                icon={<Mic className="w-6 h-6" />}
                title="Voice-First Experience"
                description="Natural speech recognition with advanced AI processing for seamless voice interactions and real-time responses."
                gradient="primary"
              />
            </AnimatedCard>

            <AnimatedCard delay={400}>
              <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title="Authentic Sources"
                description="Every answer backed by verified Islamic scholarship, Quran verses, and authentic Hadith collections."
                gradient="secondary"
              />
            </AnimatedCard>

            <AnimatedCard delay={600}>
              <FeatureCard
                icon={<Heart className="w-6 h-6" />}
                title="Compassionate AI"
                description="Respectful, caring responses that honor Islamic values and provide guidance with wisdom and empathy."
                gradient="accent"
              />
            </AnimatedCard>
          </div>

          {/* Stats Section */}
          <AnimatedCard delay={800} className="mb-20">
            <FuturisticCard variant="neon" className="p-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div>
                  <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div>
                  <MessageCircle className="w-8 h-8 text-accent mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground mb-2">1M+</div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
                <div>
                  <BookOpen className="w-8 h-8 text-spiritual mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground mb-2">100%</div>
                  <div className="text-sm text-muted-foreground">Authentic Sources</div>
                </div>
                <div>
                  <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
                  <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </FuturisticCard>
          </AnimatedCard>

          {/* Daily Verse */}
          <AnimatedCard delay={1000} className="mb-20">
            <FuturisticCard variant="glass" className="p-8 max-w-4xl mx-auto">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-6" />
                <blockquote className="text-xl font-medium text-foreground mb-6 italic leading-relaxed">
                  "And whoever relies upon Allah - then He is sufficient for him. 
                  Indeed, Allah will accomplish His purpose."
                </blockquote>
                <cite className="text-primary font-semibold">
                  — Quran 65:3
                </cite>
              </div>
            </FuturisticCard>
          </AnimatedCard>

          {/* Final CTA */}
          <AnimatedCard delay={1200} className="text-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to Begin Your Journey?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of Muslims exploring their faith through intelligent conversations
                powered by authentic Islamic knowledge.
              </p>
              
              <FuturisticButton
                variant="neon"
                size="xl"
                onClick={() => navigate('/chat')}
                className="group"
              >
                <MessageCircle className="w-6 h-6 mr-3" />
                Start Your Conversation
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </FuturisticButton>
            </div>
            
            <div className="mt-16 p-6 glass rounded-2xl border border-spiritual/20 max-w-2xl mx-auto">
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
    </div>
  )
}

export default Home