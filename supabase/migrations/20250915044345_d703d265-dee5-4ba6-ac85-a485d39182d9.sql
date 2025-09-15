-- Add some sample data to make the app more functional

-- First, let's add some sample users (these will be created when they sign up)
-- For now, we'll create sample prompts and templates

-- Insert sample public prompts for demonstration
INSERT INTO public.prompts (user_id, title, description, is_public, likes, views) VALUES
(uuid_generate_v4(), 'React Component Best Practices', 'A comprehensive prompt for creating clean, reusable React components with TypeScript', true, 15, 234),
(uuid_generate_v4(), 'API Documentation Generator', 'Generate clear and comprehensive API documentation with examples and error handling', true, 8, 156),
(uuid_generate_v4(), 'Code Review Assistant', 'A prompt to help review code for security, performance, and maintainability issues', true, 12, 189),
(uuid_generate_v4(), 'Database Schema Designer', 'Create efficient database schemas with proper relationships and constraints', true, 6, 98),
(uuid_generate_v4(), 'Git Commit Message Helper', 'Generate clear, descriptive commit messages following conventional commit standards', true, 22, 345);

-- Get the IDs of the inserted prompts to add sections
-- Note: In a real scenario, these would be linked to actual user accounts

-- Add sample prompt sections for the first prompt (React Component Best Practices)
WITH first_prompt AS (
  SELECT id FROM public.prompts WHERE title = 'React Component Best Practices' LIMIT 1
)
INSERT INTO public.prompt_sections (prompt_id, section_type, content, order_index)
SELECT 
  fp.id,
  'context',
  'You are an expert React developer with deep knowledge of TypeScript, modern React patterns, and component architecture. You focus on creating maintainable, reusable, and performant components.',
  0
FROM first_prompt fp
UNION ALL
SELECT 
  fp.id,
  'task',
  'Create a React component that follows best practices for props typing, state management, error boundaries, and accessibility. Include proper JSDoc comments and example usage.',
  1
FROM first_prompt fp
UNION ALL
SELECT 
  fp.id,
  'guidelines',
  'Use TypeScript interfaces for props, implement proper error handling, follow React hooks best practices, ensure accessibility compliance, and include comprehensive JSDoc documentation.',
  2
FROM first_prompt fp
UNION ALL
SELECT 
  fp.id,
  'constraints',
  'Do not use deprecated React features, avoid inline styles (use CSS modules or styled-components), ensure components are pure when possible, and maintain backward compatibility.',
  3
FROM first_prompt fp;

-- Add sample sections for API Documentation Generator
WITH second_prompt AS (
  SELECT id FROM public.prompts WHERE title = 'API Documentation Generator' LIMIT 1
)
INSERT INTO public.prompt_sections (prompt_id, section_type, content, order_index)
SELECT 
  sp.id,
  'context',
  'You are a technical writer specializing in API documentation. You create clear, comprehensive documentation that helps developers understand and integrate APIs effectively.',
  0
FROM second_prompt sp
UNION ALL
SELECT 
  sp.id,
  'task',
  'Generate complete API documentation including endpoints, request/response examples, authentication methods, error codes, and usage examples in multiple programming languages.',
  1
FROM second_prompt sp
UNION ALL
SELECT 
  sp.id,
  'guidelines',
  'Use OpenAPI/Swagger format when possible, include interactive examples, provide code samples in popular languages, and ensure all error scenarios are documented.',
  2
FROM second_prompt sp;

-- Add sample prompt templates
INSERT INTO public.prompt_templates (user_id, title, description, is_public, likes, views) VALUES
(uuid_generate_v4(), 'Code Review Checklist', 'A structured template for conducting thorough code reviews', true, 18, 267),
(uuid_generate_v4(), 'User Story Template', 'Template for writing clear and actionable user stories', true, 14, 203),
(uuid_generate_v4(), 'Bug Report Format', 'Standardized template for reporting bugs with all necessary information', true, 11, 145);

-- Add sections for the first template
WITH first_template AS (
  SELECT id FROM public.prompt_templates WHERE title = 'Code Review Checklist' LIMIT 1
)
INSERT INTO public.template_sections (template_id, section_type, content, order_index)
SELECT 
  ft.id,
  'context',
  'This is a comprehensive code review checklist to ensure code quality, security, and maintainability.',
  0
FROM first_template ft
UNION ALL
SELECT 
  ft.id,
  'guidelines',
  'Check for: 1) Code functionality and logic correctness 2) Security vulnerabilities 3) Performance implications 4) Code style and formatting 5) Test coverage 6) Documentation completeness',
  1
FROM first_template ft;

-- Add some sample user points and badges for gamification
INSERT INTO public.user_points (user_id, points, reason) VALUES
(uuid_generate_v4(), 50, 'Created first public prompt'),
(uuid_generate_v4(), 25, 'Received 10 likes on a prompt'),
(uuid_generate_v4(), 75, 'Prompt featured on homepage'),
(uuid_generate_v4(), 100, 'Reached 1000 total views'),
(uuid_generate_v4(), 30, 'Active community member');

-- Add some sample badges
INSERT INTO public.user_badges (user_id, badge_type) VALUES
(uuid_generate_v4(), 'first_prompt'),
(uuid_generate_v4(), 'popular_creator'),
(uuid_generate_v4(), 'community_helper'),
(uuid_generate_v4(), 'prompt_master');