-- Add sample data without foreign key violations

-- Insert sample public prompts with NULL user_id (will be updated when real users sign up)
INSERT INTO public.prompts (user_id, title, description, is_public, likes, views) VALUES
(NULL, 'React Component Best Practices', 'A comprehensive prompt for creating clean, reusable React components with TypeScript', true, 15, 234),
(NULL, 'API Documentation Generator', 'Generate clear and comprehensive API documentation with examples and error handling', true, 8, 156),
(NULL, 'Code Review Assistant', 'A prompt to help review code for security, performance, and maintainability issues', true, 12, 189),
(NULL, 'Database Schema Designer', 'Create efficient database schemas with proper relationships and constraints', true, 6, 98),
(NULL, 'Git Commit Message Helper', 'Generate clear, descriptive commit messages following conventional commit standards', true, 22, 345);

-- Add sample prompt sections for the first prompt
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
(NULL, 'Code Review Checklist', 'A structured template for conducting thorough code reviews', true, 18, 267),
(NULL, 'User Story Template', 'Template for writing clear and actionable user stories', true, 14, 203),
(NULL, 'Bug Report Format', 'Standardized template for reporting bugs with all necessary information', true, 11, 145);

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