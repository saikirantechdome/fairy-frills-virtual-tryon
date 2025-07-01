
-- Create a storage bucket for try-on images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon-images', 'tryon-images', true);

-- Create a table for try-on sessions
CREATE TABLE public.tryon_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_image_url TEXT NOT NULL,
  dress_image_url TEXT NOT NULL,
  result_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tryon_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read and create sessions (since no auth is required)
CREATE POLICY "Anyone can view tryon sessions" 
  ON public.tryon_sessions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create tryon sessions" 
  ON public.tryon_sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update tryon sessions" 
  ON public.tryon_sessions 
  FOR UPDATE 
  USING (true);

-- Enable realtime for the table
ALTER TABLE public.tryon_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tryon_sessions;

-- Create storage policies for the bucket
CREATE POLICY "Anyone can upload to tryon-images bucket" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'tryon-images');

CREATE POLICY "Anyone can view tryon-images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'tryon-images');

CREATE POLICY "Anyone can update tryon-images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'tryon-images');
