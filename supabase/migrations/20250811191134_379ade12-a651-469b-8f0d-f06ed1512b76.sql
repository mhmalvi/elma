-- Phase 1: Schema Hardening and Performance Optimization

-- Add unique constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_user_endpoint_window_unique UNIQUE (user_id, endpoint, window_start);

-- Add performance indexes for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON public.chat_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON public.chat_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created 
ON public.bookmarks (user_id, created_at DESC);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to update conversation timestamp when messages are added
CREATE TRIGGER touch_conversation_on_message_insert
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_conversation_updated_at();