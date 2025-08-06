import { useState } from "react"
import { ArrowLeft, BookOpen, Trash2, Share, Play } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface Bookmark {
  id: string
  message: string
  source?: {
    verse?: string
    hadith?: string
    reference?: string
  }
  savedAt: string
}

const Bookmarks = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Sample bookmarks data
  const [bookmarks] = useState<Bookmark[]>([
    {
      id: '1',
      message: 'In Islam, forgiveness is highly valued. Allah says in the Quran: "But whoever forgives and makes reconciliation, his reward is with Allah." Forgiveness brings us closer to righteousness and earns Allah\'s mercy.',
      source: {
        verse: "Ash-Shura 42:40",
        hadith: "Sahih Bukhari 6853",
        reference: "The virtue of forgiveness in Islam"
      },
      savedAt: "2 hours ago"
    },
    {
      id: '2',
      message: 'Prayer (Salah) is the second pillar of Islam and a direct connection between the believer and Allah. It purifies the soul and provides guidance throughout the day.',
      source: {
        verse: "Al-Baqarah 2:45",
        reference: "The importance of prayer in Islam"
      },
      savedAt: "1 day ago"
    },
    {
      id: '3',
      message: 'Seeking knowledge is obligatory upon every Muslim. The Prophet (PBUH) said: "Seek knowledge from the cradle to the grave."',
      source: {
        hadith: "Ibn Majah 224",
        reference: "The virtue of seeking knowledge"
      },
      savedAt: "3 days ago"
    }
  ])

  const handleShare = (bookmark: Bookmark) => {
    if (navigator.share) {
      navigator.share({
        title: 'Islamic Knowledge from AirChatBot',
        text: bookmark.message,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(bookmark.message)
      toast({
        title: "Copied to clipboard",
        description: "The message has been copied to your clipboard"
      })
    }
  }

  const handleDelete = (bookmarkId: string) => {
    toast({
      title: "Bookmark removed",
      description: "The bookmark has been deleted"
    })
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
        <h1 className="text-lg font-semibold">My Bookmarks</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No bookmarks yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Save important verses and answers from your conversations
            </p>
            <Button onClick={() => navigate('/chat')}>
              Start Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Saved Knowledge</h2>
              <span className="text-sm text-muted-foreground">
                ({bookmarks.length})
              </span>
            </div>

            {bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="p-4 shadow-soft">
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">
                    {bookmark.message}
                  </p>
                  
                  {bookmark.source && (
                    <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                      {bookmark.source.verse && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Quran: {bookmark.source.verse}</span>
                        </div>
                      )}
                      {bookmark.source.hadith && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Hadith: {bookmark.source.hadith}</span>
                        </div>
                      )}
                      {bookmark.source.reference && (
                        <div className="text-xs opacity-70">
                          {bookmark.source.reference}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Saved {bookmark.savedAt}
                    </span>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(bookmark)}
                        className="h-8 px-2"
                      >
                        <Share className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bookmark.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bookmarks