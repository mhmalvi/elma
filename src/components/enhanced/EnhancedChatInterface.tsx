import React from 'react';
import { ConversationInterface } from '@/components/conversation/ConversationInterface';
import { cn } from '@/lib/utils';
import { VoiceModeProvider } from '@/contexts/VoiceModeContext';

interface EnhancedChatInterfaceProps {
  className?: string;
}

export const EnhancedChatInterface = ({ className }: EnhancedChatInterfaceProps) => {
  return (
    <VoiceModeProvider>
      <ConversationInterface className={className} />
    </VoiceModeProvider>
  );
};