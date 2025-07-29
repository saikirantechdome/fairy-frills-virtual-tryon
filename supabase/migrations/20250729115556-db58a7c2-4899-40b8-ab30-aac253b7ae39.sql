-- Add user_id column to tryon_sessions table
ALTER TABLE public.tryon_sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Anyone can create tryon sessions" ON public.tryon_sessions;
DROP POLICY IF EXISTS "Anyone can view tryon sessions" ON public.tryon_sessions;
DROP POLICY IF EXISTS "Anyone can update tryon sessions" ON public.tryon_sessions;

-- Create user-specific policies
CREATE POLICY "Users can create their own tryon sessions" 
ON public.tryon_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tryon sessions" 
ON public.tryon_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tryon sessions" 
ON public.tryon_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);