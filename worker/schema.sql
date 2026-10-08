-- Prompt-Gineer — D1 schema + seed data
-- Apply with: npm run db:init:remote  (and db:init:local for local dev)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_premium INTEGER NOT NULL DEFAULT 0,
  allow_learning INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_public ON prompts(is_public, created_at);

CREATE TABLE IF NOT EXISTS prompt_sections (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prompt_sections_prompt ON prompt_sections(prompt_id);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_user ON prompt_templates(user_id);

CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES prompt_templates(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, prompt_id),
  UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES prompt_templates(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_prompt ON comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_comments_template ON comments(template_id);

CREATE TABLE IF NOT EXISTS user_points (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  earned_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_points_user ON user_points(user_id);

CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS user_ai_services (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  api_key_encrypted TEXT,
  base_url TEXT,
  model TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, service_name)
);

CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT NOT NULL,
  ad_size TEXT NOT NULL CHECK (ad_size IN ('small', 'medium', 'large')),
  ad_position TEXT NOT NULL CHECK (ad_position IN ('top', 'side', 'inline', 'bottom')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ads_lookup ON ads(is_active, ad_size, ad_position);

CREATE TABLE IF NOT EXISTS user_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_counters (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  generations INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Seed data: sample public prompts, templates and ads so the community pages
-- are alive out of the box (user_id NULL => shown as "Prompt-Gineer Team").
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO prompts (id, user_id, title, description, is_public, likes, views, created_at, updated_at) VALUES
 ('00000000-0000-4000-8000-000000000001', NULL, 'React Component Best Practices', 'A comprehensive prompt for creating clean, reusable React components with TypeScript', 1, 15, 234, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000002', NULL, 'API Documentation Generator', 'Generate clear and comprehensive API documentation with examples and error handling', 1, 8, 156, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000003', NULL, 'Code Review Assistant', 'A prompt to help review code for security, performance, and maintainability issues', 1, 12, 189, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000004', NULL, 'Database Schema Designer', 'Create efficient database schemas with proper relationships and constraints', 1, 6, 98, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000005', NULL, 'Git Commit Message Helper', 'Generate clear, descriptive commit messages following conventional commit standards', 1, 22, 345, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO prompt_sections (id, prompt_id, section_type, content, order_index) VALUES
 ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'context', 'You are an expert React developer with deep knowledge of TypeScript, modern React patterns, and component architecture. You focus on creating maintainable, reusable, and performant components.', 0),
 ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'task', 'Create a React component that follows best practices for props typing, state management, error boundaries, and accessibility. Include proper JSDoc comments and example usage.', 1),
 ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'guidelines', 'Use TypeScript interfaces for props, implement proper error handling, follow React hooks best practices, ensure accessibility compliance, and include comprehensive JSDoc documentation.', 2),
 ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'constraints', 'Do not use deprecated React features, avoid inline styles (use CSS modules or styled-components), ensure components are pure when possible, and maintain backward compatibility.', 3),
 ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', 'context', 'You are a technical writer specializing in API documentation. You create clear, comprehensive documentation that helps developers understand and integrate APIs effectively.', 0),
 ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000002', 'task', 'Generate complete API documentation including endpoints, request/response examples, authentication methods, error codes, and usage examples in multiple programming languages.', 1),
 ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000002', 'guidelines', 'Use OpenAPI/Swagger format when possible, include interactive examples, provide code samples in popular languages, and ensure all error scenarios are documented.', 2);

INSERT OR IGNORE INTO prompt_templates (id, user_id, title, description, is_public, likes, views, created_at, updated_at) VALUES
 ('00000000-0000-4000-8000-000000000101', NULL, 'Code Review Checklist', 'A structured template for conducting thorough code reviews', 1, 18, 267, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000102', NULL, 'User Story Template', 'Template for writing clear and actionable user stories', 1, 14, 203, datetime('now'), datetime('now')),
 ('00000000-0000-4000-8000-000000000103', NULL, 'Bug Report Format', 'Standardized template for reporting bugs with all necessary information', 1, 11, 145, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO template_sections (id, template_id, section_type, content, order_index) VALUES
 ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'context', 'This is a comprehensive code review checklist to ensure code quality, security, and maintainability.', 0),
 ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000101', 'guidelines', 'Check for: 1) Code functionality and logic correctness 2) Security vulnerabilities 3) Performance implications 4) Code style and formatting 5) Test coverage 6) Documentation completeness', 1),
 ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000102', 'context', 'You are a product manager writing user stories for an agile development team.', 0),
 ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', 'task', 'Write a user story in the format: As a [role], I want [feature], so that [benefit]. Include acceptance criteria.', 1);

INSERT OR IGNORE INTO ads (id, title, content, image_url, link_url, ad_size, ad_position, is_active, created_at) VALUES
 ('30000000-0000-4000-8000-000000000001', 'Upgrade to Pro', 'Get unlimited AI generations and remove ads with Prompt-Gineer Pro!', NULL, '/auth', 'small', 'top', 1, datetime('now')),
 ('30000000-0000-4000-8000-000000000002', 'Prompt Engineering Workshop', 'Join our exclusive AI prompt engineering workshop this weekend.', NULL, 'https://example.com', 'medium', 'side', 1, datetime('now')),
 ('30000000-0000-4000-8000-000000000003', 'Template Library', 'Explore our template library with professional prompts.', NULL, '/community', 'large', 'inline', 1, datetime('now')),
 ('30000000-0000-4000-8000-000000000004', 'Pro Tips', 'Master prompt engineering with our advanced techniques guide.', NULL, '/community', 'small', 'bottom', 1, datetime('now'));

-- Gamification/activity history (written on signup and actions; read on profile).
CREATE TABLE IF NOT EXISTS user_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_history_user ON user_history (user_id, created_at DESC);
