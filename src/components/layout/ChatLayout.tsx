import React from 'react';

import { EnhancedChatInterface } from '@/components/enhanced/EnhancedChatInterface';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout = ({ className }: ChatLayoutProps) => {
  return (
    <div className={cn("flex h-full bg-background", className)}>
      <div className="flex-1 flex flex-col min-w-0">
        <EnhancedChatInterface className="flex-1" />
      </div>
    </div>
  );
};