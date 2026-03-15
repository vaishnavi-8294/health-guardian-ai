
-- Role enum
CREATE TYPE public.app_role AS ENUM ('citizen', 'asha_worker', 'health_authority');

-- User roles table (must come first)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (must come before policies that use it)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Health authorities can view all roles" ON public.user_roles FOR SELECT USING (
  public.has_role(auth.uid(), 'health_authority'::app_role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Health authorities can view all profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'health_authority'::app_role)
);

-- Disease reports table
CREATE TABLE public.disease_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  symptoms TEXT[] NOT NULL,
  suspected_disease TEXT,
  location TEXT NOT NULL,
  water_source TEXT,
  sanitation_condition TEXT,
  reported_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ASHA workers can insert reports" ON public.disease_reports FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'asha_worker'::app_role)
);
CREATE POLICY "ASHA workers can view own reports" ON public.disease_reports FOR SELECT USING (
  auth.uid() = reported_by
);
CREATE POLICY "Health authorities can view all reports" ON public.disease_reports FOR SELECT USING (
  public.has_role(auth.uid(), 'health_authority'::app_role)
);

-- AI suggestions table
CREATE TABLE public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.disease_reports(id) ON DELETE CASCADE NOT NULL,
  predicted_disease TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence_score NUMERIC(5,2) NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ASHA workers can view own suggestions" ON public.ai_suggestions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.disease_reports WHERE id = report_id AND reported_by = auth.uid())
);
CREATE POLICY "Health authorities can view all suggestions" ON public.ai_suggestions FOR SELECT USING (
  public.has_role(auth.uid(), 'health_authority'::app_role)
);
CREATE POLICY "System can insert suggestions" ON public.ai_suggestions FOR INSERT WITH CHECK (true);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  disease TEXT NOT NULL,
  location TEXT NOT NULL,
  case_count INTEGER NOT NULL DEFAULT 0,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'critical', 'emergency')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update alerts" ON public.alerts FOR UPDATE USING (true);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Awareness content table
CREATE TABLE public.awareness_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.awareness_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view awareness content" ON public.awareness_content FOR SELECT USING (true);
CREATE POLICY "Health authorities can manage content" ON public.awareness_content FOR ALL USING (
  public.has_role(auth.uid(), 'health_authority'::app_role)
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profile auto-creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'citizen'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
