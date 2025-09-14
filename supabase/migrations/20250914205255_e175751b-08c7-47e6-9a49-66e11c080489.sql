-- Fix security warnings by setting proper search_path for functions

-- Update handle_new_user function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_updated_at function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update encrypt_api_key function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;