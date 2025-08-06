import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedChatInterface } from '@/components/enhanced/EnhancedChatInterface';

const Chat = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-full flex flex-col">
      <EnhancedChatInterface className="flex-1" />
    </div>
  );
};

export default Chat;