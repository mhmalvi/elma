import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Conversation {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: any[];
  qdrant_context?: any;
  metadata?: any;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Failed to load conversations",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Failed to load messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setMessagesLoading(false);
    }
  }, [user, toast]);

  // Create new conversation
  const createConversation = useCallback(async (title: string, firstMessage?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: title.substring(0, 100),
          metadata: firstMessage ? { first_message: firstMessage } : {}
        })
        .select()
        .single();

      if (error) throw error;
      
      const newConversation = data as Conversation;
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Failed to create conversation",
        description: "Please try again later",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Update conversation
  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedConversation = data as Conversation;
      setConversations(prev => 
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );

      if (currentConversation?.id === id) {
        setCurrentConversation(updatedConversation);
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: "Failed to update conversation",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [user, currentConversation, toast]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Failed to delete conversation",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [user, currentConversation, toast]);

  // Select conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
  }, [loadMessages]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Add message to current conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Real-time subscription to new messages
  useEffect(() => {
    if (!user || !currentConversation) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage.user_id === user.id) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentConversation]);

  // Load conversations on user change
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    messagesLoading,
    loadConversations,
    loadMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    startNewConversation,
    addMessage
  };
};