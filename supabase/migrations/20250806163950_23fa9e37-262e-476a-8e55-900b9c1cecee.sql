-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master admins can update all profiles" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile during signup" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a service role policy for admin operations (bypasses RLS)
-- This will be used by functions, not directly by users