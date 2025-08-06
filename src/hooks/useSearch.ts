import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"

export interface SearchResult {
  type: 'conversation' | 'message'
  id: string
  title: string
  content: string
  created_at: string
  conversation_id?: string
  match_score?: number
}

export const useSearch = () => {
  const { user } = useAuth()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const searchConversations = async (query: string): Promise<SearchResult[]> => {
    if (!user || !query.trim()) return []

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return data.map(conv => ({
      type: 'conversation' as const,
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      content: conv.title || '',
      created_at: conv.created_at
    }))
  }

  const searchMessages = async (query: string): Promise<SearchResult[]> => {
    if (!user || !query.trim()) return []

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        conversation_id,
        conversations!inner(title)
      `)
      .eq('user_id', user.id)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return data.map((msg: any) => ({
      type: 'message' as const,
      id: msg.id,
      title: msg.conversations.title || 'Untitled Conversation',
      content: msg.content,
      created_at: msg.created_at,
      conversation_id: msg.conversation_id
    }))
  }

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const [conversations, messages] = await Promise.all([
        searchConversations(query),
        searchMessages(query)
      ])

      // Combine and sort results by relevance and recency
      const combinedResults = [...conversations, ...messages]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setResults(combinedResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return {
    results,
    loading,
    search,
    clearResults
  }
}