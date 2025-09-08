-- Remove Knowledge Base Tables - Use Qdrant Instead
-- This migration removes redundant Islamic content tables from Supabase
-- as all knowledge base data is now served from Qdrant vector database

-- Drop the search function first
DROP FUNCTION IF EXISTS public.search_islamic_content(text, integer);

-- Drop dependent tables first (foreign key constraints)
DROP TABLE IF EXISTS public.content_verification CASCADE;

-- Drop main knowledge base tables
DROP TABLE IF EXISTS public.hadith_collection CASCADE;
DROP TABLE IF EXISTS public.islamic_scholars CASCADE; 
DROP TABLE IF EXISTS public.quran_verses CASCADE;

-- Clean up any remaining indexes that might reference these tables
-- (This is safe - if indexes don't exist, it will just skip)
DROP INDEX IF EXISTS idx_quran_verses_chapter;
DROP INDEX IF EXISTS idx_quran_verses_verse_number;
DROP INDEX IF EXISTS idx_hadith_collection_book;
DROP INDEX IF EXISTS idx_hadith_collection_grading;
DROP INDEX IF EXISTS idx_islamic_scholars_specialization;
DROP INDEX IF EXISTS idx_content_verification_status;

-- Remove any RLS policies related to these tables
-- (PostgreSQL will automatically drop them when tables are dropped, but being explicit)

-- Log the migration
DO $$ 
BEGIN 
    RAISE NOTICE 'Knowledge base tables removed successfully. All Islamic content now served from Qdrant vector database.';
END $$;