import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Mic, 
  Volume2, 
  BookOpen, 
  Heart, 
  ArrowRight, 
  ArrowLeft,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export const UserOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isRecording,
    isProcessingVoice,
    isPlayingAudio,
    transcript,
    startRecording,
    stopRecording,
    speakText,
    stopAudio
  } = useVoiceIntegration();

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const testVoiceInput = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
      // Auto-stop after 3 seconds for demo
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
          markStepComplete('voice');
        }
      }, 3000);
    }
  };

  const testVoiceOutput = async () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      await speakText("Welcome to AirChatBot! This is how I sound when answering your questions about Islam.");
      markStepComplete('audio');
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AirChatBot',
      description: 'Your Islamic AI companion for spiritual guidance',
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Assalamu Alaikum!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to your personalized Islamic learning journey. AirChatBot provides authentic 
              answers from the Quran and Hadith, with voice interaction for a natural conversation experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary"><BookOpen className="w-3 h-3 mr-1" />Authentic Sources</Badge>
            <Badge variant="secondary"><Mic className="w-3 h-3 mr-1" />Voice Enabled</Badge>
            <Badge variant="secondary"><Heart className="w-3 h-3 mr-1" />Compassionate AI</Badge>
          </div>
          <Button onClick={() => markStepComplete('welcome')} className="mt-4">
            Let's Begin
          </Button>
        </div>
      )
    },
    {
      id: 'voice',
      title: 'Test Voice Input',
      description: 'Try speaking to AirChatBot',
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Voice Input Test</h3>
            <p className="text-muted-foreground mb-4">
              Click the button below and say something like "What is patience in Islam?"
            </p>
            {transcript && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">You said:</p>
                <p className="text-foreground">{transcript}</p>
              </div>
            )}
          </div>
          <Button 
            onClick={testVoiceInput}
            disabled={isProcessingVoice}
            variant={isRecording ? "destructive" : "default"}
          >
            {isProcessingVoice ? (
              <>Processing...</>
            ) : isRecording ? (
              <>Stop Recording</>
            ) : (
              <>Start Voice Test</>
            )}
          </Button>
        </div>
      )
    },
    {
      id: 'audio',
      title: 'Test Voice Output', 
      description: 'Hear how AirChatBot responds',
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Volume2 className={`w-10 h-10 ${isPlayingAudio ? 'text-primary animate-pulse' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Voice Output Test</h3>
            <p className="text-muted-foreground mb-4">
              Listen to how AirChatBot will speak to you with a warm, compassionate voice.
            </p>
          </div>
          <Button 
            onClick={testVoiceOutput}
            variant={isPlayingAudio ? "destructive" : "default"}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Audio
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Voice Response
              </>
            )}
          </Button>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Example Questions',
      description: 'Learn what you can ask',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">What Can You Ask?</h3>
            <p className="text-muted-foreground mb-6">
              AirChatBot can help with various aspects of Islamic knowledge and spiritual guidance.
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              "What does Islam say about patience?",
              "How should I pray when traveling?", 
              "Tell me about charity in Islam",
              "What is the meaning of this Quranic verse?",
              "How do I find peace in difficult times?"
            ].map((question, index) => (
              <div 
                key={index}
                className="p-3 bg-muted rounded-lg text-left cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => {
                  toast({
                    title: "Great choice!",
                    description: "You can ask this question when you start chatting."
                  });
                  markStepComplete('examples');
                }}
              >
                <p className="text-sm">"{question}"</p>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => markStepComplete('examples')} 
            variant="outline" 
            className="w-full mt-4"
          >
            I understand what I can ask
          </Button>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'Ready to Begin!',
      description: 'Start your Islamic learning journey',
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">You're All Set!</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              You've completed the onboarding process. You can now start having meaningful 
              conversations about Islam with your AI companion.
            </p>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-2">
                "And say: My Lord, increase me in knowledge."
              </p>
              <p className="text-xs text-muted-foreground">
                — Quran 20:114
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/chat')}
            size="lg"
            className="primary-gradient"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start Chatting
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = completedSteps.has(currentStepData.id) || currentStep === 0;

  useEffect(() => {
    // Auto-advance on welcome step
    if (currentStep === 0 && completedSteps.has('welcome')) {
      setTimeout(nextStep, 1000);
    }
  }, [completedSteps, currentStep]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Progress value={progress} className="flex-1 mx-4" />
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="min-h-[400px] flex items-center justify-center">
            {currentStepData.content}
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button 
              variant="ghost" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : index < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={nextStep}
                disabled={!canProceed}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/chat')}
                variant="default"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};