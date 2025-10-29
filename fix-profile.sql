-- Fix Profile for Existing User
-- Run this in Supabase SQL Editor

-- Create profile for the authenticated user
INSERT INTO public.profiles (user_id, display_name)
VALUES ('34c0fa4a-ef8a-4d69-9461-04d447b1e751', 'User')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the profile was created
SELECT * FROM public.profiles WHERE user_id = '34c0fa4a-ef8a-4d69-9461-04d447b1e751';
