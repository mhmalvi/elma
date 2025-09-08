-- BACKUP SCRIPT: Knowledge Base Tables
-- Run this BEFORE applying the cleanup migration if you want to backup data
-- This creates a backup of all knowledge base tables that will be removed

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_kb_$(date +%Y%m%d);

-- Backup quran_verses table
CREATE TABLE backup_kb_$(date +%Y%m%d).quran_verses AS 
SELECT * FROM public.quran_verses;

-- Backup hadith_collection table  
CREATE TABLE backup_kb_$(date +%Y%m%d).hadith_collection AS
SELECT * FROM public.hadith_collection;

-- Backup islamic_scholars table
CREATE TABLE backup_kb_$(date +%Y%m%d).islamic_scholars AS
SELECT * FROM public.islamic_scholars;

-- Backup content_verification table
CREATE TABLE backup_kb_$(date +%Y%m%d).content_verification AS  
SELECT * FROM public.content_verification;

-- Export search function definition
CREATE OR REPLACE FUNCTION backup_kb_$(date +%Y%m%d).search_islamic_content_backup(
    search_query TEXT,
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    content TEXT,
    reference TEXT,
    source_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a backup copy of the original search function
    -- Implementation would go here if needed for restoration
    RETURN;
END;
$$;

-- Log backup completion
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'backup_kb_$(date +%Y%m%d)'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;