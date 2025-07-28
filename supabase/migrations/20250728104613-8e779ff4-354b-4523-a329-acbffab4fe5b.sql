-- Add resultMessage column to try_on_sessions table
ALTER TABLE public.tryon_sessions 
ADD COLUMN result_message text;

-- Update the updated_at trigger to work with the new column
CREATE TRIGGER update_tryon_sessions_updated_at
    BEFORE UPDATE ON public.tryon_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();