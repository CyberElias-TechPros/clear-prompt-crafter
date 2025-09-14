-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_learning BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT NOT NULL,
  ad_size TEXT NOT NULL CHECK (ad_size IN ('small', 'medium', 'large')),
  ad_position TEXT NOT NULL CHECK (ad_position IN ('top', 'side', 'inline', 'bottom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_ai_services table
CREATE TABLE public.user_ai_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  api_key_id UUID, -- Reference to encrypted key in vault
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- Create prompts table
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_sections table
CREATE TABLE public.prompt_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('context', 'task', 'guidelines', 'constraints', 'examples', 'custom')),
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_templates table
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_sections table
CREATE TABLE public.template_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('context', 'task', 'guidelines', 'constraints', 'examples', 'custom')),
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((prompt_id IS NOT NULL AND template_id IS NULL) OR (prompt_id IS NULL AND template_id IS NOT NULL))
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id),
  UNIQUE(user_id, template_id),
  CHECK ((prompt_id IS NOT NULL AND template_id IS NULL) OR (prompt_id IS NULL AND template_id IS NOT NULL))
);

-- Create user_history table
CREATE TABLE public.user_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Create user_points table
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ads (public read, admin manage)
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RLS Policies for user_ai_services
CREATE POLICY "Users can manage own AI services" ON public.user_ai_services FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for prompts
CREATE POLICY "Users can view public prompts and own prompts" ON public.prompts FOR SELECT USING (
  is_public = true OR auth.uid() = user_id
);
CREATE POLICY "Users can manage own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prompt_sections
CREATE POLICY "Users can view sections of accessible prompts" ON public.prompt_sections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_sections.prompt_id 
    AND (prompts.is_public = true OR prompts.user_id = auth.uid())
  )
);
CREATE POLICY "Users can manage sections of own prompts" ON public.prompt_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_sections.prompt_id 
    AND prompts.user_id = auth.uid()
  )
);

-- RLS Policies for prompt_templates
CREATE POLICY "Anyone can view public templates" ON public.prompt_templates FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own templates" ON public.prompt_templates FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for template_sections
CREATE POLICY "Users can view sections of public templates" ON public.template_sections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.prompt_templates 
    WHERE prompt_templates.id = template_sections.template_id 
    AND prompt_templates.is_public = true
  )
);
CREATE POLICY "Users can manage sections of own templates" ON public.template_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.prompt_templates 
    WHERE prompt_templates.id = template_sections.template_id 
    AND prompt_templates.user_id = auth.uid()
  )
);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_history
CREATE POLICY "Users can view own history" ON public.user_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.user_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Anyone can view points" ON public.user_points FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id, allow_learning, theme, is_premium)
  VALUES (NEW.id, true, 'light', false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_ai_services_updated_at BEFORE UPDATE ON public.user_ai_services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_prompt_sections_updated_at BEFORE UPDATE ON public.prompt_sections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_template_sections_updated_at BEFORE UPDATE ON public.template_sections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to encrypt API keys (used by edge functions)
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_value TEXT)
RETURNS UUID AS $$
DECLARE
  key_id UUID;
BEGIN
  -- Generate a new UUID for the key
  key_id := uuid_generate_v4();
  
  -- In a real implementation, this would use Supabase Vault
  -- For now, we'll just return the UUID as a placeholder
  -- The actual encryption should be handled by Supabase Vault in production
  
  RETURN key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_user_ai_services_user_id ON public.user_ai_services(user_id);
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_prompts_public ON public.prompts(is_public) WHERE is_public = true;
CREATE INDEX idx_prompt_sections_prompt_id ON public.prompt_sections(prompt_id);
CREATE INDEX idx_template_sections_template_id ON public.template_sections(template_id);
CREATE INDEX idx_comments_prompt_id ON public.comments(prompt_id);
CREATE INDEX idx_comments_template_id ON public.comments(template_id);
CREATE INDEX idx_likes_prompt_id ON public.likes(prompt_id);
CREATE INDEX idx_likes_template_id ON public.likes(template_id);
CREATE INDEX idx_ads_active_size_position ON public.ads(is_active, ad_size, ad_position) WHERE is_active = true;

-- Insert some sample ads for development
INSERT INTO public.ads (title, content, link_url, ad_size, ad_position, image_url) VALUES
('Upgrade to Pro', 'Get unlimited prompts and remove ads with Prompt-Gineer Pro!', '/auth', 'small', 'top', null),
('AI Workshop', 'Join our exclusive AI prompt engineering workshop this weekend.', 'https://example.com', 'medium', 'side', null),
('Template Library', 'Explore our premium template library with 500+ professional prompts.', '/community', 'large', 'inline', null),
('Pro Tips', 'Master prompt engineering with our advanced techniques guide.', '/community', 'small', 'bottom', null);