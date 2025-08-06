import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, FileText, Calendar } from "lucide-react"
import { useSearch, SearchResult } from "@/hooks/useSearch"
import { useConversations } from "@/hooks/useConversations"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState("")
  const { results, loading, search, clearResults } = useSearch()
  const { selectConversation, conversations } = useConversations()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query)
      } else {
        clearResults()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleResultClick = async (result: SearchResult) => {
    if (result.type === 'conversation') {
      const conversation = conversations.find(c => c.id === result.id)
      if (conversation) {
        selectConversation(conversation)
      }
    } else if (result.type === 'message' && result.conversation_id) {
      const conversation = conversations.find(c => c.id === result.conversation_id)
      if (conversation) {
        selectConversation(conversation)
        // Scroll to message would be implemented here
      }
    }
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuery("")
      clearResults()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Conversations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations and messages..."
              className="pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-96">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {result.type === 'conversation' ? (
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {result.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        
                        {result.type === 'message' && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!query && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start typing to search your conversations...</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}