import React from 'react';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { EnhancedChatInterface } from '@/components/enhanced/EnhancedChatInterface';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout = ({ className }: ChatLayoutProps) => {
  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Conversation Sidebar */}
      <div className="w-80 border-r border-border/50 bg-background/95 backdrop-blur-xl">
        <ConversationSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <EnhancedChatInterface className="flex-1" />
      </div>
    </div>
  );
};