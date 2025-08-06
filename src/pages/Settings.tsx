import { useState } from "react"
import { ArrowLeft, Moon, Sun, Bell, Globe, Volume2, LogOut, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { VoiceTestSuite } from '@/components/voice/VoiceTestSuite'
import { IslamicContentSeeder } from '@/components/database/IslamicContentSeeder'
import { EdgeFunctionMonitor } from '@/components/monitoring/EdgeFunctionMonitor'

const Settings = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [dailyReminders, setDailyReminders] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [voiceSpeed, setVoiceSpeed] = useState("normal")

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
    toast({
      title: "Theme updated",
      description: `Switched to ${!isDarkMode ? 'dark' : 'light'} mode`
    })
  }

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    })
    // Add logout logic here
  }

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
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch
              checked={isDarkMode}
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

        {/* Voice */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Settings
          </h3>
          
          <div>
            <p className="font-medium mb-2">Voice Speed</p>
            <Select value={voiceSpeed} onValueChange={setVoiceSpeed}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* System Diagnostics - High Priority Testing */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            System Diagnostics
          </h3>
          <div className="space-y-6">
            <VoiceTestSuite />
            <IslamicContentSeeder />
            <EdgeFunctionMonitor />
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