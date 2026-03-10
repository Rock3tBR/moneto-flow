
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: admins can read all roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to list all users with plans (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users_with_plans()
RETURNS TABLE(user_id uuid, email text, plan text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id as user_id,
    u.email::text,
    COALESCE(up.plan::text, 'free') as plan,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_plans up ON up.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at DESC
$$;

-- Function to update a user's plan (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(_target_user_id uuid, _new_plan app_plan)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE public.user_plans SET plan = _new_plan, updated_at = now()
  WHERE user_id = _target_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_plans (user_id, plan) VALUES (_target_user_id, _new_plan);
  END IF;
END;
$$;
