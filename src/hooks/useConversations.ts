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
    if (!user?.id) return;

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
  }, [user?.id, toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user?.id) {
      console.log('No user found, cannot load messages');
      return;
    }

    console.log('Loading messages for conversation:', conversationId);
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log('RAW SUPABASE MESSAGE RESPONSE:', data);
      console.log('Messages found:', data?.length || 0);
      
      setMessages((data || []) as ChatMessage[]);
      console.log('Messages set in state, length:', (data || []).length);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Failed to load messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setMessagesLoading(false);
      console.log('Message loading completed');
    }
  }, [user?.id, toast]);

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
      
      // Set as current conversation and clear messages
      setCurrentConversation(newConversation);
      setMessages([]);
      
      // Add to conversations list as fallback (in case real-time fails)
      setConversations(prev => {
        if (prev.find(conv => conv.id === newConversation.id)) {
          return prev; // Already exists
        }
        return [newConversation, ...prev];
      });
      
      console.log('Created new conversation:', newConversation);
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
    console.log('Selecting conversation:', conversation.title, conversation.id);
    
    // CRITICAL: Set the current conversation FIRST
    setCurrentConversation(conversation);
    console.log('Current conversation set to:', conversation.id);
    
    // Then load messages
    await loadMessages(conversation.id);
    console.log('Conversation selected and messages loaded');
  }, [loadMessages]);

  // Start new conversation
  const startNewConversation = useCallback(async () => {
    setCurrentConversation(null);
    setMessages([]);
    // Refresh the conversations list to show any updates
    await loadConversations();
  }, [loadConversations]);

  // Add message to current conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Real-time subscription to conversations only
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to conversation changes - simplified to avoid binding mismatch
    const conversationChannel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          // Only process if it's for this user
          const data = payload.new || payload.old;
          if (data && (data as any).user_id === user.id) {
            console.log('Realtime conversation event:', payload.eventType);
            if (payload.eventType === 'INSERT') {
              const newConversation = payload.new as Conversation;
              setConversations(prev => {
                if (prev.find(conv => conv.id === newConversation.id)) {
                  return prev;
                }
                return [newConversation, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedConversation = payload.new as Conversation;
              setConversations(prev => 
                prev.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv)
              );
            } else if (payload.eventType === 'DELETE') {
              setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Conversation channel subscription status:', status);
        if (err) {
          console.error('Conversation channel subscription error:', err);
        }
      });

    return () => {
      console.log('Cleaning up conversation subscription');
      supabase.removeChannel(conversationChannel);
    };
  }, [user?.id]);

  // Separate effect for message subscriptions
  useEffect(() => {
    if (!user || !currentConversation) return;

    console.log('Setting up message subscription for conversation:', currentConversation.id);
    
    const messageChannel = supabase
      .channel(`chat-messages-${currentConversation.id}`, {
        config: {
          presence: {
            key: `${user.id}-${currentConversation.id}`,
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        (payload) => {
          console.log('Realtime message event:', payload);
          const newMessage = payload.new as ChatMessage;
          if (newMessage.user_id === user.id) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(msg => msg.id === newMessage.id)) {
                console.log('Message already exists, skipping duplicate');
                return prev;
              }
              console.log('Adding new message:', newMessage.content.substring(0, 50) + '...');
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Message channel subscription status:', status);
        if (err) {
          console.error('Message channel subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to message changes for conversation:', currentConversation.id);
        }
      });

    return () => {
      console.log('Cleaning up message subscription for conversation:', currentConversation.id);
      supabase.removeChannel(messageChannel);
    };
  }, [user, currentConversation]);

  // Load conversations on user change
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user?.id, loadConversations]);

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