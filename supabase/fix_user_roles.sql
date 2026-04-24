-- ======================================================
-- FIX: Ensure all auth users have a row in public.users
-- Run this in Supabase SQL Editor
-- ======================================================

-- 1. Create rows in public.users for any auth users that don't have one yet
INSERT INTO public.users (id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'student'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- 2. Now set a specific user as admin (replace with YOUR email):
UPDATE public.users 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com' LIMIT 1);

-- 3. Verify: check all users and their roles
SELECT pu.id, au.email, pu.full_name, pu.role
FROM public.users pu
JOIN auth.users au ON au.id = pu.id
ORDER BY pu.created_at DESC;
