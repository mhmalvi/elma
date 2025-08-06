import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { useToast } from "./use-toast"

export interface Bookmark {
  id: string
  message_id: string
  title: string
  tags: string[]
  notes: string
  created_at: string
  user_id: string
}

export interface BookmarkWithMessage extends Bookmark {
  message_content: string
  conversation_title: string
}

export const useBookmarks = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState<BookmarkWithMessage[]>([])
  const [loading, setLoading] = useState(false)

  // Load bookmarks with message content
  const loadBookmarks = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          chat_messages!inner(
            content,
            conversation_id,
            conversations!inner(title)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const bookmarksWithMessages = data.map((bookmark: any) => ({
        ...bookmark,
        message_content: bookmark.chat_messages.content,
        conversation_title: bookmark.chat_messages.conversations.title
      }))

      setBookmarks(bookmarksWithMessages)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      toast({
        title: "Failed to load bookmarks",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Add bookmark
  const addBookmark = async (messageId: string, title: string, tags: string[] = []) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          message_id: messageId,
          title,
          tags,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Bookmark saved",
        description: "Message bookmarked successfully"
      })

      loadBookmarks() // Refresh list
      return data
    } catch (error) {
      console.error('Error adding bookmark:', error)
      toast({
        title: "Failed to save bookmark",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  // Update bookmark
  const updateBookmark = async (id: string, updates: Partial<Bookmark>) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Bookmark updated",
        description: "Changes saved successfully"
      })

      loadBookmarks()
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast({
        title: "Failed to update bookmark",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Bookmark deleted",
        description: "Bookmark removed successfully"
      })

      loadBookmarks()
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast({
        title: "Failed to delete bookmark",
        description: "Please try again later",
        variant: "destructive"
      })
    }
  }

  // Search bookmarks
  const searchBookmarks = (query: string) => {
    if (!query.trim()) return bookmarks

    const searchTerm = query.toLowerCase()
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(searchTerm) ||
      bookmark.message_content.toLowerCase().includes(searchTerm) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      bookmark.notes?.toLowerCase().includes(searchTerm)
    )
  }

  // Filter by tags
  const filterByTags = (tags: string[]) => {
    if (tags.length === 0) return bookmarks

    return bookmarks.filter(bookmark =>
      tags.some(tag => bookmark.tags.includes(tag))
    )
  }

  // Get all unique tags
  const getAllTags = () => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags)
    return [...new Set(allTags)].sort()
  }

  useEffect(() => {
    if (user) {
      loadBookmarks()
    }
  }, [user])

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    searchBookmarks,
    filterByTags,
    getAllTags,
    loadBookmarks
  }
}