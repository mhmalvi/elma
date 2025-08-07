-- Phase 1: Conversation recency triggers and performance indexes

-- 1) Ensure updated_at on conversations updates when chat_messages are inserted
DROP TRIGGER IF EXISTS trg_touch_conversation_updated_at ON public.chat_messages;
CREATE TRIGGER trg_touch_conversation_updated_at
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_updated_at();

-- 2) Ensure conversations.updated_at updates on conversation updates
DROP TRIGGER IF EXISTS trg_update_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated_at
  ON public.conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created_at
  ON public.chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created_at
  ON public.bookmarks (user_id, created_at);
