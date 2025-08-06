import { useState } from "react"
import { Plus, MessageSquare, MoreVertical, Trash2, Edit2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModernCard } from "@/components/ui/modern-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Conversation } from "@/hooks/useConversations"
import { useConversationsContext } from "@/contexts/ConversationsContext"
import { formatDistanceToNow } from "date-fns"

interface ConversationSidebarProps {
  className?: string
}

export const ConversationSidebar = ({ className }: ConversationSidebarProps) => {
  const {
    conversations,
    currentConversation,
    loading,
    selectConversation,
    startNewConversation,
    updateConversation,
    deleteConversation
  } = useConversationsContext()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditConversation = (conversation: Conversation) => {
    setEditingConversation(conversation)
    setEditTitle(conversation.title)
  }

  const handleSaveEdit = async () => {
    if (editingConversation && editTitle.trim()) {
      await updateConversation(editingConversation.id, { title: editTitle.trim() })
      setEditingConversation(null)
      setEditTitle("")
    }
  }

  const handleDeleteConversation = async (conversation: Conversation) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(conversation.id)
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            onClick={startNewConversation}
            size="sm"
            className="primary-gradient"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery ? "Try a different search term" : "Start a new conversation to begin"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ModernCard
                key={conversation.id}
                className={cn(
                  "p-3 cursor-pointer transition-all duration-200 hover:shadow-medium group",
                  currentConversation?.id === conversation.id
                    ? "ring-2 ring-primary/30 bg-primary/5"
                    : "hover:bg-muted/30"
                )}
                onClick={() => selectConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate mb-1">
                      {conversation.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditConversation(conversation)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteConversation(conversation)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </ModernCard>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingConversation} onOpenChange={() => setEditingConversation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter conversation title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingConversation(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}