-- 1. Create Role Enum
DO $$ BEGIN     CREATE TYPE app_role AS ENUM ('employee', 'manager', 'admin'); EXCEPTION     WHEN duplicate_object THEN null; END $$;

-- 2. Create Profiles Table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  branch TEXT,
  role app_role DEFAULT 'employee' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Security Definer helper to fetch current user's role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role AS $$SELECT role FROM public.profiles WHERE id = auth.uid();$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Security Definer helper to fetch current user's branch
CREATE OR REPLACE FUNCTION public.get_my_branch()
RETURNS TEXT AS $$SELECT branch FROM public.profiles WHERE id = auth.uid();$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Auto-create Profile Trigger on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ BEGIN   INSERT INTO public.profiles (id, email, full_name, branch, role)   VALUES (     new.id,     new.email,     COALESCE(new.raw_user_meta_data->>'full_name', ''),     COALESCE(new.raw_user_meta_data->>'branch', ''),     COALESCE((new.raw_user_meta_data->>'role')::app_role, 'employee')   )   ON CONFLICT (id) DO NOTHING;   RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security Policies for profiles
CREATE POLICY "Users view own profile or admins view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.get_my_role() = 'admin');

CREATE POLICY "Users can update own details (excluding role)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile and assign roles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin');
