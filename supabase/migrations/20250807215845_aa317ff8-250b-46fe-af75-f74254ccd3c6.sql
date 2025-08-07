-- Ensure conversations.updated_at is maintained
-- Trigger to auto-update updated_at on conversation updates
DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
CREATE TRIGGER set_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to touch conversation when a new message arrives
CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Trigger to update conversation on new chat message
DROP TRIGGER IF EXISTS touch_conversation_on_message ON public.chat_messages;
CREATE TRIGGER touch_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated_at ON public.conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created_at ON public.chat_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created_at ON public.bookmarks (user_id, created_at);