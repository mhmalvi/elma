import { useState, useMemo } from "react"
import { Navigate } from "react-router-dom"
import { Search, Tag, Edit3, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ModernCard } from "@/components/ui/modern-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TopAppBar } from "@/components/ui/top-app-bar"
import { LoadingDots } from "@/components/ui/loading-dots"
import { BookmarkDialog } from "@/components/bookmarks/BookmarkDialog"
import { ExportDialog } from "@/components/export/ExportDialog"
import { useAuth } from "@/hooks/useAuth"
import { useBookmarks } from "@/hooks/useBookmarks"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

const Bookmarks = () => {
  const { user, loading: authLoading } = useAuth()
  const { bookmarks, loading, deleteBookmark, getAllTags } = useBookmarks()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingBookmark, setEditingBookmark] = useState<any>(null)
  const [showExport, setShowExport] = useState(false)

  // Move all hooks to top level before any conditionals
  const allTags = getAllTags()

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.message_content.toLowerCase().includes(query) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query)) ||
        bookmark.notes?.toLowerCase().includes(query)
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(bookmark =>
        selectedTags.some(tag => bookmark.tags.includes(tag))
      )
    }

    return filtered
  }, [bookmarks, searchQuery, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleDeleteBookmark = async (id: string) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      await deleteBookmark(id)
    }
  }

  // Now handle early returns after all hooks
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopAppBar
        title="Bookmarks"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(true)}
              disabled={bookmarks.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="pl-10"
            />
          </div>

          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingDots />
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            {bookmarks.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground">
                  Start bookmarking important messages from your conversations
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No matching bookmarks</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {filteredBookmarks.map((bookmark) => (
                <ModernCard key={bookmark.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate">{bookmark.title}</h3>
                        {bookmark.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {bookmark.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {bookmark.message_content}
                      </p>
                      
                      {bookmark.notes && (
                        <p className="text-sm italic text-muted-foreground mb-2 line-clamp-1">
                          "{bookmark.notes}"
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>From: {bookmark.conversation_title}</span>
                        <span>
                          Saved {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingBookmark(bookmark)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Edit Bookmark Dialog */}
      <BookmarkDialog
        open={!!editingBookmark}
        onOpenChange={(open) => !open && setEditingBookmark(null)}
        existingBookmark={editingBookmark}
        onSave={() => setEditingBookmark(null)}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
      />
    </div>
  )
}

export default Bookmarks