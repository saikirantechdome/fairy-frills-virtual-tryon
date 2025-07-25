-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email text;

-- Update the trigger function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email
  );
  RETURN NEW;
END;
$function$;