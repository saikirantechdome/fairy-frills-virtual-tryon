
-- Create a table to store dress options
CREATE TABLE public.dress_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dress_options ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read dress options (public data)
CREATE POLICY "Anyone can view dress options" 
  ON public.dress_options 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to insert dress options (for initial setup)
CREATE POLICY "Anyone can create dress options" 
  ON public.dress_options 
  FOR INSERT 
  WITH CHECK (true);

-- Insert the dress options with placeholder URLs (we'll update these after uploading)
INSERT INTO public.dress_options (name, image_url) VALUES
  ('Purple Sparkle Dress', 'placeholder-1'),
  ('Rose Floral Dress', 'placeholder-2'),
  ('Pink Bow Dress', 'placeholder-3'),
  ('Pink Ruffle Dress', 'placeholder-4'),
  ('White Tulle Dress', 'placeholder-5'),
  ('Peach Flower Dress', 'placeholder-6'),
  ('Black Sparkle Dress', 'placeholder-7'),
  ('Blue Princess Dress', 'placeholder-8'),
  ('Yellow Rose Dress', 'placeholder-9');
