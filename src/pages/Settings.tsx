import { useState, useEffect } from "react"
import { ArrowLeft, Moon, Sun, Bell, Globe, Volume2, LogOut, Info, Shield, Mic, TestTube, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { VoiceTestSuite } from '@/components/voice/VoiceTestSuite'
import { IslamicContentSeeder } from '@/components/database/IslamicContentSeeder'
import { EdgeFunctionMonitor } from '@/components/monitoring/EdgeFunctionMonitor'
import { useRole } from '@/hooks/useRole'

const Settings = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const { isMasterAdmin } = useRole()
  
  const [dailyReminders, setDailyReminders] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "alloy",
    speed: 1.0,
    autoPlay: true
  })

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    toast({
      title: "Theme updated",
      description: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`
    })
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      })
      navigate('/auth')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      })
    }
  }

  const voices = [
    { id: 'alloy', name: 'Alloy (Default)', description: 'Neutral and clear' },
    { id: 'echo', name: 'Echo', description: 'Warm and expressive' },
    { id: 'fable', name: 'Fable', description: 'Calm and soothing' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
    { id: 'nova', name: 'Nova', description: 'Bright and energetic' },
    { id: 'shimmer', name: 'Shimmer', description: 'Gentle and melodic' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/chat')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        
        {/* Appearance */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Reminders</p>
              <p className="text-sm text-muted-foreground">Receive daily verses and Hadith</p>
            </div>
            <Switch
              checked={dailyReminders}
              onCheckedChange={setDailyReminders}
            />
          </div>
        </Card>

        {/* Language */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Interface Language</p>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar" disabled>Arabic (Coming Soon)</SelectItem>
                  <SelectItem value="ur" disabled>Urdu (Coming Soon)</SelectItem>
                  <SelectItem value="hi" disabled>Hindi (Coming Soon)</SelectItem>
                  <SelectItem value="bn" disabled>Bangla (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Voice Settings - Enhanced */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Preferences
          </h3>
          
          <div className="space-y-6">
            {/* Voice Selection */}
            <div>
              <p className="font-medium mb-2">Voice</p>
              <p className="text-sm text-muted-foreground mb-3">Choose your preferred AI voice</p>
              <Select 
                value={voiceSettings.voice} 
                onValueChange={(value) => setVoiceSettings(prev => ({...prev, voice: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Speech Speed</p>
                <span className="text-sm text-muted-foreground">{voiceSettings.speed}x</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Adjust how fast the AI speaks</p>
              <Slider
                value={[voiceSettings.speed]}
                onValueChange={([value]) => setVoiceSettings(prev => ({...prev, speed: value}))}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Auto-play */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-play Responses</p>
                <p className="text-sm text-muted-foreground">Automatically play voice responses</p>
              </div>
              <Switch
                checked={voiceSettings.autoPlay}
                onCheckedChange={(checked) => setVoiceSettings(prev => ({...prev, autoPlay: checked}))}
              />
            </div>

            {/* Voice Test */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/voice-test')}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Test Voice Settings
            </Button>
          </div>
        </Card>

        {/* Master Admin Credentials - Only show during development */}
        {import.meta.env.DEV && (
          <Card className="p-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Development Credentials
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-background/60 rounded border">
                <p className="font-medium">Master Admin Login:</p>
                <p className="font-mono">Email: admin@airchatbot.com</p>
                <p className="font-mono">Password: MasterAdmin2024!</p>
              </div>
              <p className="text-xs text-muted-foreground">
                These credentials are only shown in development mode for testing purposes.
              </p>
            </div>
          </Card>
        )}

        {/* Admin Tools - Only for Master Admin */}
        {isMasterAdmin() && (
          <Card className="p-4 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Tools
            </h3>
            <div className="space-y-6">
              <VoiceTestSuite />
              <IslamicContentSeeder />
              <EdgeFunctionMonitor />
            </div>
          </Card>
        )}

        {/* Voice Features - Now moved here from sidebar */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Voice Features
          </h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/voice-test')}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Voice Test
              <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
                Beta
              </Badge>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/voice-quality')}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Voice Quality
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/performance')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/bookmarks')}
          >
            <BookmarksIcon className="w-4 h-4 mr-2" />
            My Bookmarks
          </Button>
          
          {isMasterAdmin() && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              toast({
                title: "About AirChatBot",
                description: "Version 1.0.0 - Your Islamic AI companion"
              })
            }}
          >
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>
        </div>

        {/* Logout */}
        <Card className="p-4 border-destructive/20">
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>

        {/* Footer */}
        <div className="text-center pt-6">
          <p className="text-sm text-muted-foreground">
            "And whoever relies upon Allah - then He is sufficient for him."
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Quran 65:3
          </p>
        </div>
      </div>
    </div>
  )
}

// Simple bookmark icon component since lucide-react doesn't have bookmarks
const BookmarksIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
    />
  </svg>
)

export default Settings