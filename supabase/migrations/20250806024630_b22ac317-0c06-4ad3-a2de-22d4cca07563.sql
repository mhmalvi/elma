-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('master_admin', 'tenant_admin', 'moderator', 'user');

-- Create tenants table for multi-tenancy
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, tenant_id, role)
);

-- Create tenant_memberships table
CREATE TABLE public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, tenant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role, _tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (_tenant_id IS NULL OR tenant_id = _tenant_id OR role = 'master_admin')
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id UUID, _tenant_id UUID DEFAULT NULL)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles 
     WHERE user_id = _user_id 
       AND is_active = true
       AND (_tenant_id IS NULL OR tenant_id = _tenant_id OR role = 'master_admin')
     ORDER BY 
       CASE role 
         WHEN 'master_admin' THEN 1
         WHEN 'tenant_admin' THEN 2
         WHEN 'moderator' THEN 3
         WHEN 'user' THEN 4
       END
     LIMIT 1),
    'user'::public.app_role
  )
$$;

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION public.get_user_tenants(_user_id UUID)
RETURNS TABLE(tenant_id UUID, tenant_name TEXT, tenant_slug TEXT, user_role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    COALESCE(ur.role, 'user'::public.app_role) as user_role
  FROM public.tenants t
  LEFT JOIN public.tenant_memberships tm ON t.id = tm.tenant_id AND tm.user_id = _user_id AND tm.is_active = true
  LEFT JOIN public.user_roles ur ON t.id = ur.tenant_id AND ur.user_id = _user_id AND ur.is_active = true
  WHERE t.is_active = true
    AND (tm.user_id IS NOT NULL OR EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id AND role = 'master_admin' AND is_active = true
    ))
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view tenants they belong to" ON public.tenants
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT tenant_id FROM public.tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        ) OR
        public.has_role(auth.uid(), 'master_admin')
    );

CREATE POLICY "Master admins can manage all tenants" ON public.tenants
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'master_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'master_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Tenant admins can manage roles in their tenant" ON public.user_roles
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'master_admin') OR
        (public.has_role(auth.uid(), 'tenant_admin', tenant_id) AND role != 'master_admin')
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'master_admin') OR
        (public.has_role(auth.uid(), 'tenant_admin', tenant_id) AND role != 'master_admin')
    );

-- RLS Policies for tenant_memberships
CREATE POLICY "Users can view their own memberships" ON public.tenant_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can manage memberships" ON public.tenant_memberships
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'master_admin') OR
        public.has_role(auth.uid(), 'tenant_admin', tenant_id)
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'master_admin') OR
        public.has_role(auth.uid(), 'tenant_admin', tenant_id)
    );

-- Create default tenant and master admin
INSERT INTO public.tenants (name, slug, settings) VALUES 
    ('Default Organization', 'default', '{"features": ["voice", "chat", "islamic_content"]}'::jsonb);

-- Update existing profiles to reference tenants
ALTER TABLE public.profiles ADD COLUMN default_tenant_id UUID REFERENCES public.tenants(id);

-- Update conversations and chat_messages to support multi-tenancy
ALTER TABLE public.conversations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.chat_messages ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- Update existing data to use default tenant
UPDATE public.profiles SET default_tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default');
UPDATE public.conversations SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default');
UPDATE public.chat_messages SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default');

-- Add triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();