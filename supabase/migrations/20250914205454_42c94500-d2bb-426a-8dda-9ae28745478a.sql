-- Create RPC functions needed for the application

-- Function to get public prompts with user info and search
CREATE OR REPLACE FUNCTION public.get_public_prompts(
  sort_by TEXT DEFAULT 'recent',
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  like_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.created_at,
    p.updated_at,
    p.user_id,
    pr.full_name as user_name,
    pr.avatar_url as user_avatar,
    COALESCE(p.likes, 0) as like_count
  FROM public.prompts p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.is_public = true
    AND (search_term IS NULL OR 
         p.title ILIKE '%' || search_term || '%' OR 
         p.description ILIKE '%' || search_term || '%')
  ORDER BY 
    CASE 
      WHEN sort_by = 'popular' THEN COALESCE(p.likes, 0)
      ELSE 0
    END DESC,
    CASE 
      WHEN sort_by = 'recent' THEN p.created_at
      ELSE p.created_at
    END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get public templates with user info and search
CREATE OR REPLACE FUNCTION public.get_public_templates(
  sort_by TEXT DEFAULT 'recent',
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  like_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.created_at,
    t.updated_at,
    t.user_id,
    pr.full_name as user_name,
    pr.avatar_url as user_avatar,
    COALESCE(t.likes, 0) as like_count
  FROM public.prompt_templates t
  LEFT JOIN public.profiles pr ON pr.id = t.user_id
  WHERE t.is_public = true
    AND (search_term IS NULL OR 
         t.title ILIKE '%' || search_term || '%' OR 
         t.description ILIKE '%' || search_term || '%')
  ORDER BY 
    CASE 
      WHEN sort_by = 'popular' THEN COALESCE(t.likes, 0)
      ELSE 0
    END DESC,
    CASE 
      WHEN sort_by = 'recent' THEN t.created_at
      ELSE t.created_at
    END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  badge_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    COALESCE(points_sum.total_points, 0) as total_points,
    COALESCE(badge_count.count, 0) as badge_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      up.user_id,
      SUM(up.points) as total_points
    FROM public.user_points up
    GROUP BY up.user_id
  ) points_sum ON points_sum.user_id = p.id
  LEFT JOIN (
    SELECT 
      ub.user_id,
      COUNT(*) as count
    FROM public.user_badges ub
    GROUP BY ub.user_id
  ) badge_count ON badge_count.user_id = p.id
  WHERE COALESCE(points_sum.total_points, 0) > 0 OR COALESCE(badge_count.count, 0) > 0
  ORDER BY total_points DESC, badge_count DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get prompt details with sections
CREATE OR REPLACE FUNCTION public.get_prompt_details(prompt_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  is_public BOOLEAN,
  likes INTEGER,
  views INTEGER,
  sections JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.created_at,
    p.updated_at,
    p.user_id,
    pr.full_name as user_name,
    pr.avatar_url as user_avatar,
    p.is_public,
    COALESCE(p.likes, 0) as likes,
    COALESCE(p.views, 0) as views,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', ps.id,
          'section_type', ps.section_type,
          'content', ps.content,
          'order_index', ps.order_index
        ) ORDER BY ps.order_index
      )
      FROM public.prompt_sections ps 
      WHERE ps.prompt_id = p.id), '[]'::jsonb
    ) as sections
  FROM public.prompts p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.id = prompt_id
    AND (p.is_public = true OR p.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get template details with sections
CREATE OR REPLACE FUNCTION public.get_template_details(template_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  is_public BOOLEAN,
  likes INTEGER,
  views INTEGER,
  sections JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.created_at,
    t.updated_at,
    t.user_id,
    pr.full_name as user_name,
    pr.avatar_url as user_avatar,
    t.is_public,
    COALESCE(t.likes, 0) as likes,
    COALESCE(t.views, 0) as views,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', ts.id,
          'section_type', ts.section_type,
          'content', ts.content,
          'order_index', ts.order_index
        ) ORDER BY ts.order_index
      )
      FROM public.template_sections ts 
      WHERE ts.template_id = t.id), '[]'::jsonb
    ) as sections
  FROM public.prompt_templates t
  LEFT JOIN public.profiles pr ON pr.id = t.user_id
  WHERE t.id = template_id
    AND (t.is_public = true OR t.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_prompt_views(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompts 
  SET views = COALESCE(views, 0) + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_template_views(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.prompt_templates 
  SET views = COALESCE(views, 0) + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to toggle likes
CREATE OR REPLACE FUNCTION public.toggle_prompt_like(prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_like UUID;
  new_like_count INTEGER;
BEGIN
  -- Check if user already liked this prompt
  SELECT id INTO existing_like
  FROM public.likes
  WHERE user_id = auth.uid() AND prompt_id = toggle_prompt_like.prompt_id;
  
  IF existing_like IS NOT NULL THEN
    -- Unlike: remove the like
    DELETE FROM public.likes WHERE id = existing_like;
    
    -- Decrement like count
    UPDATE public.prompts 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = prompt_id;
    
    RETURN FALSE; -- unliked
  ELSE
    -- Like: add the like
    INSERT INTO public.likes (user_id, prompt_id)
    VALUES (auth.uid(), prompt_id);
    
    -- Increment like count
    UPDATE public.prompts 
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = prompt_id;
    
    RETURN TRUE; -- liked
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.toggle_template_like(template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_like UUID;
  new_like_count INTEGER;
BEGIN
  -- Check if user already liked this template
  SELECT id INTO existing_like
  FROM public.likes
  WHERE user_id = auth.uid() AND template_id = toggle_template_like.template_id;
  
  IF existing_like IS NOT NULL THEN
    -- Unlike: remove the like
    DELETE FROM public.likes WHERE id = existing_like;
    
    -- Decrement like count
    UPDATE public.prompt_templates 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = template_id;
    
    RETURN FALSE; -- unliked
  ELSE
    -- Like: add the like
    INSERT INTO public.likes (user_id, template_id)
    VALUES (auth.uid(), template_id);
    
    -- Increment like count
    UPDATE public.prompt_templates 
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = template_id;
    
    RETURN TRUE; -- liked
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;