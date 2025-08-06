import React, { createContext, useContext, ReactNode } from 'react';
import { useConversations, Conversation, ChatMessage } from '@/hooks/useConversations';

interface ConversationsContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  loading: boolean;
  messagesLoading: boolean;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  createConversation: (title: string, firstMessage?: string) => Promise<Conversation | null>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  startNewConversation: () => Promise<void>;
  addMessage: (message: ChatMessage) => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider = ({ children }: ConversationsProviderProps) => {
  const conversationsHook = useConversations();

  return (
    <ConversationsContext.Provider value={conversationsHook}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversationsContext = () => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversationsContext must be used within a ConversationsProvider');
  }
  return context;
};