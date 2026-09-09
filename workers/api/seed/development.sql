-- Explicit local/staging fixture only. Do not run this against production.
INSERT OR IGNORE INTO prompts (id, user_id, title, description, mode, category, tags_json, content, is_public, likes, views, created_at, updated_at)
VALUES
  ('seed-code-review', NULL, 'Ship-ready code review', 'A rigorous review that catches correctness, security, and maintainability issues before production.', 'structured', 'Software & product', '["engineering","quality","security"]', 'ROLE\nYou are a principal software engineer reviewing a production pull request.\n\nOBJECTIVE\nReview the change and return the most important issues first, with concrete fixes.\n\nCONSTRAINTS\nDo not invent requirements. Separate blockers from suggestions.\n\nOUTPUT FORMAT\nReturn a verdict, blockers, recommended changes, questions, and a short test plan.', 1, 0, 0, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'),
  ('seed-evidence-synthesis', NULL, 'Evidence-first knowledge synthesis', 'Synthesize supplied sources while keeping uncertainty visible.', 'meta', 'Research & analysis', '["research","synthesis","reasoning"]', 'ROLE\nYou are an evidence-first research assistant.\n\nOBJECTIVE\nCompare the supplied sources and produce a useful synthesis.\n\nCONSTRAINTS\nDo not invent citations or fill gaps with confident guesses.\n\nOUTPUT FORMAT\nReturn an executive summary, evidence table, caveats, and open questions.', 1, 0, 0, '2026-09-02T10:00:00.000Z', '2026-09-02T10:00:00.000Z');

INSERT OR IGNORE INTO prompt_sections (id, prompt_id, section_type, content, order_index, created_at, updated_at)
VALUES
  ('seed-code-review-role', 'seed-code-review', 'role', 'You are a principal software engineer reviewing a production pull request.', 0, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'),
  ('seed-code-review-objective', 'seed-code-review', 'objective', 'Review the change and return the most important issues first, with concrete fixes.', 1, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'),
  ('seed-code-review-constraints', 'seed-code-review', 'constraints', 'Do not invent requirements. Separate blockers from suggestions.', 2, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'),
  ('seed-code-review-output', 'seed-code-review', 'output', 'Return a verdict, blockers, recommended changes, questions, and a short test plan.', 3, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z'),
  ('seed-evidence-role', 'seed-evidence-synthesis', 'role', 'You are an evidence-first research assistant.', 0, '2026-09-02T10:00:00.000Z', '2026-09-02T10:00:00.000Z'),
  ('seed-evidence-objective', 'seed-evidence-synthesis', 'objective', 'Compare the supplied sources and produce a useful synthesis.', 1, '2026-09-02T10:00:00.000Z', '2026-09-02T10:00:00.000Z'),
  ('seed-evidence-constraints', 'seed-evidence-synthesis', 'constraints', 'Do not invent citations or fill gaps with confident guesses.', 2, '2026-09-02T10:00:00.000Z', '2026-09-02T10:00:00.000Z'),
  ('seed-evidence-output', 'seed-evidence-synthesis', 'output', 'Return an executive summary, evidence table, caveats, and open questions.', 3, '2026-09-02T10:00:00.000Z', '2026-09-02T10:00:00.000Z');
