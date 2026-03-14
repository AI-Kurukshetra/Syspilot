-- Align auth signup metadata and profile role values with app roles.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'user'));

UPDATE public.profiles
SET role = 'user'
WHERE role NOT IN ('admin', 'manager', 'user');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id uuid;
  signup_role text;
BEGIN
  SELECT id INTO default_company_id
  FROM public.companies
  WHERE code = 'DEFAULT'
  LIMIT 1;

  IF default_company_id IS NULL THEN
    INSERT INTO public.companies (name, code, industry)
    VALUES ('My Company', 'DEFAULT', 'Manufacturing')
    RETURNING id INTO default_company_id;
  END IF;

  signup_role := lower(coalesce(NEW.raw_user_meta_data ->> 'role', 'user'));

  IF signup_role NOT IN ('admin', 'manager', 'user') THEN
    signup_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    default_company_id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    signup_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    company_id = coalesce(public.profiles.company_id, EXCLUDED.company_id);

  RETURN NEW;
END;
$$;
