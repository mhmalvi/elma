import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, File } from "lucide-react"
import { useConversationsContext } from "@/contexts/ConversationsContext"
import { useBookmarks } from "@/hooks/useBookmarks"
import { format } from "date-fns"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: string
}

export const ExportDialog = ({ open, onOpenChange, conversationId }: ExportDialogProps) => {
  const { conversations, messages } = useConversationsContext()
  const { bookmarks } = useBookmarks()
  const [exportType, setExportType] = useState<'conversation' | 'bookmarks' | 'all'>('conversation')
  const [exportFormat, setExportFormat] = useState<'txt' | 'json' | 'md'>('txt')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [exporting, setExporting] = useState(false)

  const exportAsText = (data: any) => {
    if (exportType === 'conversation') {
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) return ""

      let text = `# ${conversation.title || 'Untitled Conversation'}\n`
      text += `Date: ${format(new Date(conversation.created_at), 'PPpp')}\n\n`

      messages.forEach((message) => {
        text += `**${message.role === 'user' ? 'You' : 'AI'}**: ${message.content}\n`
        if (includeMetadata && message.created_at) {
          text += `_${format(new Date(message.created_at), 'pp')}_\n`
        }
        text += "\n"
      })

      return text
    } else if (exportType === 'bookmarks') {
      let text = "# My Bookmarks\n\n"
      bookmarks.forEach((bookmark) => {
        text += `## ${bookmark.title}\n`
        text += `**Content**: ${bookmark.message_content}\n`
        text += `**Conversation**: ${bookmark.conversation_title}\n`
        if (bookmark.tags.length > 0) {
          text += `**Tags**: ${bookmark.tags.join(', ')}\n`
        }
        if (bookmark.notes) {
          text += `**Notes**: ${bookmark.notes}\n`
        }
        if (includeMetadata) {
          text += `**Saved**: ${format(new Date(bookmark.created_at), 'PPpp')}\n`
        }
        text += "\n---\n\n"
      })
      return text
    }
    return ""
  }

  const exportAsMarkdown = (data: any) => {
    return exportAsText(data) // Same format for now
  }

  const exportAsJSON = (data: any) => {
    if (exportType === 'conversation') {
      const conversation = conversations.find(c => c.id === conversationId)
      return JSON.stringify({
        conversation,
        messages: includeMetadata ? messages : messages.map(m => ({ role: m.role, content: m.content })),
        exported_at: new Date().toISOString()
      }, null, 2)
    } else if (exportType === 'bookmarks') {
      return JSON.stringify({
        bookmarks: includeMetadata ? bookmarks : bookmarks.map(b => ({
          title: b.title,
          content: b.message_content,
          tags: b.tags,
          notes: b.notes
        })),
        exported_at: new Date().toISOString()
      }, null, 2)
    }
    return ""
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      let content = ""
      let filename = ""
      let mimeType = ""

      if (exportFormat === 'txt') {
        content = exportAsText(null)
        filename = `${exportType}-${Date.now()}.txt`
        mimeType = "text/plain"
      } else if (exportFormat === 'md') {
        content = exportAsMarkdown(null)
        filename = `${exportType}-${Date.now()}.md`
        mimeType = "text/markdown"
      } else if (exportFormat === 'json') {
        content = exportAsJSON(null)
        filename = `${exportType}-${Date.now()}.json`
        mimeType = "application/json"
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">What to export</Label>
            <RadioGroup value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conversation" id="conversation" />
                <Label htmlFor="conversation">Current conversation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bookmarks" id="bookmarks" />
                <Label htmlFor="bookmarks">All bookmarks</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Export format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Plain Text (.txt)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="md" id="md" />
                <Label htmlFor="md" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Markdown (.md)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  JSON (.json)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
            />
            <Label htmlFor="metadata" className="text-sm">
              Include timestamps and metadata
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}