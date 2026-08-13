-- AI Forum schema
-- All timestamps are stored as BIGINT millisecond epoch values.

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  title_raw TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_seed TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  ai_assisted BOOLEAN DEFAULT FALSE,
  related_question_ids UUID[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_seed TEXT NOT NULL,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  ai_source_answer_ids UUID[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_answer_ids UUID[] DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'generating',
  generated_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  feedback_count JSONB DEFAULT '{"helpful":0,"needsUpdate":0,"inaccurate":0}'
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY,
  identity_id TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  value SMALLINT NOT NULL,
  comment TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_question_id ON ai_summaries(question_id);
CREATE INDEX IF NOT EXISTS idx_feedback_target_id ON feedback(target_id);
