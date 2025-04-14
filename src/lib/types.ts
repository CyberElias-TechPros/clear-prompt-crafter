// Auth and User types
export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  role: 'user' | 'admin' | string;
};

export type UserSettings = {
  user_id: string;
  allow_learning: boolean;
  theme: 'light' | 'dark' | string;
  updated_at: string;
  is_premium: boolean;
};

export type AIService = {
  id: string;
  user_id: string;
  service_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Prompt types
export type Prompt = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  sections?: PromptSection[];
  likes?: number;
  views?: number;
};

export type PromptSection = {
  id: string;
  prompt_id: string;
  section_type: 'context' | 'task' | 'guidelines' | 'constraints' | 'examples' | 'custom';
  content: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type PromptTemplate = {
  id: string;
  user_id: string | null;
  is_public: boolean;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  sections?: TemplateSection[];
  likes?: number;
  views?: number;
};

export type TemplateSection = {
  id: string;
  template_id: string;
  section_type: 'context' | 'task' | 'guidelines' | 'constraints' | 'examples' | 'custom';
  content: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type UserHistory = {
  id: string;
  user_id: string;
  action_type: string;
  data: any;
  created_at: string;
};

// Community and Gamification types
export type UserBadge = {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
};

export type UserPoint = {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  earned_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  prompt_id: string | null;
  template_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
};

export type Like = {
  id: string;
  user_id: string;
  prompt_id: string | null;
  template_id: string | null;
  created_at: string;
};

// AI Service Integration types
export type SupportedAIService = {
  id: string;
  name: string;
  logo: string;
  description: string;
  authUrl: string;
  apiKeyTitle?: string;
};

// Leaderboard types
export type LeaderboardUser = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  badge_count: number;
};

export type Ad = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string;
  ad_size: "small" | "medium" | "large";
  ad_position: "top" | "side" | "inline" | "bottom";
  is_active: boolean;
  created_at: string;
};
