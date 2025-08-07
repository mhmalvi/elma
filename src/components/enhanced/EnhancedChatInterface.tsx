import React from 'react';
import { ConversationInterface } from '@/components/conversation/ConversationInterface';
import { cn } from '@/lib/utils';

interface EnhancedChatInterfaceProps {
  className?: string;
}

export const EnhancedChatInterface = ({ className }: EnhancedChatInterfaceProps) => {
  return (
    <ConversationInterface className={className} />
  );
};