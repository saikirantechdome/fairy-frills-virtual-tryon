-- Backfill profiles table with existing users from auth.users
INSERT INTO public.profiles (user_id, name, phone, email)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data ->> 'name', '') as name,
  COALESCE(raw_user_meta_data ->> 'phone', '') as phone,
  email
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;