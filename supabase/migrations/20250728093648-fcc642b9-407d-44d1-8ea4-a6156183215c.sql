-- Create resultMessage table for tracking try-on results
CREATE TABLE public.result_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  result_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.result_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since anyone can create and view try-on sessions)
CREATE POLICY "Anyone can view result messages" 
ON public.result_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create result messages" 
ON public.result_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update result messages" 
ON public.result_messages 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_result_messages_updated_at
BEFORE UPDATE ON public.result_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups by session_id
CREATE INDEX idx_result_messages_session_id ON public.result_messages(session_id);