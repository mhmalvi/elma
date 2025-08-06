import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"
import { useBookmarks, Bookmark } from "@/hooks/useBookmarks"

interface BookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId?: string
  messageContent?: string
  existingBookmark?: Bookmark
  onSave?: () => void
}

export const BookmarkDialog = ({
  open,
  onOpenChange,
  messageId,
  messageContent,
  existingBookmark,
  onSave
}: BookmarkDialogProps) => {
  const { addBookmark, updateBookmark } = useBookmarks()
  const [title, setTitle] = useState(existingBookmark?.title || "")
  const [notes, setNotes] = useState(existingBookmark?.notes || "")
  const [tags, setTags] = useState<string[]>(existingBookmark?.tags || [])
  const [currentTag, setCurrentTag] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)
    try {
      if (existingBookmark) {
        await updateBookmark(existingBookmark.id, {
          title: title.trim(),
          notes: notes.trim(),
          tags
        })
      } else if (messageId) {
        await addBookmark(messageId, title.trim(), tags)
      }

      onSave?.()
      onOpenChange(false)
      
      // Reset form
      setTitle("")
      setNotes("")
      setTags([])
      setCurrentTag("")
    } catch (error) {
      console.error('Error saving bookmark:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingBookmark ? "Edit Bookmark" : "Save Bookmark"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {messageContent && !existingBookmark && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Message:</p>
              <p className="text-sm line-clamp-3">{messageContent}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this bookmark a title..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!currentTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this bookmark..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving ? "Saving..." : "Save Bookmark"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}