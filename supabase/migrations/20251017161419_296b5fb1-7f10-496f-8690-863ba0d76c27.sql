-- Create organization plan tier enum
CREATE TYPE public.org_plan_tier AS ENUM ('starter', 'growth', 'scale', 'custom');

-- Create organization member role enum
CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'member');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_tier org_plan_tier NOT NULL DEFAULT 'starter',
  seat_count INTEGER NOT NULL DEFAULT 10,
  seats_used INTEGER NOT NULL DEFAULT 0,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  billing_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role org_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create organization_presets table
CREATE TABLE public.organization_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  preset_theme TEXT NOT NULL,
  preset_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organization members can view their organization"
  ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage all organizations"
  ON public.organizations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for organization_members
CREATE POLICY "Organization members can view other members"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage members"
  ON public.organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organization_members.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage all organization members"
  ON public.organization_members
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for organization_presets
CREATE POLICY "Organization members can view presets"
  ON public.organization_presets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organization_presets.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage presets"
  ON public.organization_presets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organization_presets.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage all organization presets"
  ON public.organization_presets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_presets_org_id ON public.organization_presets(organization_id);
CREATE INDEX idx_organizations_status ON public.organizations(status);

-- Create trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for updated_at on organization_presets
CREATE TRIGGER update_organization_presets_updated_at
  BEFORE UPDATE ON public.organization_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to automatically update seats_used count
CREATE OR REPLACE FUNCTION public.update_organization_seats_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.organizations
    SET seats_used = seats_used + 1
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.organizations
    SET seats_used = GREATEST(0, seats_used - 1)
    WHERE id = OLD.organization_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update seats_used when members are added/removed
CREATE TRIGGER update_org_seats_count
  AFTER INSERT OR DELETE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_seats_used();