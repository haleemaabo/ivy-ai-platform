-- Migration Script: Phase 1 Data Model & Schema Infrastructure

-- 1. Create Sprints Table
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_name TEXT NOT NULL,
  department TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PLANNED')),
  target_workflows_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Enums for Workflow Steps Redesign
DO $$ BEGIN
  CREATE TYPE action_type_enum AS ENUM ('ELIMINATE', 'SIMPLIFY', 'STANDARDIZE', 'AUTOMATE', 'AUGMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE human_ai_mode_enum AS ENUM ('AGENT_EXECUTES', 'AGENT_DRAFTS_HUMAN_OWNS', 'HUMAN_UNCHANGED', 'ELIMINATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Enhance Workflows Table
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS baseline_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blended_hourly_rate NUMERIC DEFAULT 85.00,
  ADD COLUMN IF NOT EXISTS quality_gate_threshold NUMERIC DEFAULT 3.5;

-- 4. Update Workflow Steps Table
ALTER TABLE public.workflow_steps
  ADD COLUMN IF NOT EXISTS action_type action_type_enum,
  ADD COLUMN IF NOT EXISTS human_ai_mode human_ai_mode_enum,
  ADD COLUMN IF NOT EXISTS before_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS after_hours NUMERIC DEFAULT 0;

-- 5. Create Quality Reviews Table
CREATE TABLE IF NOT EXISTS public.quality_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accuracy NUMERIC CHECK (accuracy >= 1 AND accuracy <= 5),
  completeness NUMERIC CHECK (completeness >= 1 AND completeness <= 5),
  actionability NUMERIC CHECK (actionability >= 1 AND actionability <= 5),
  compliance NUMERIC CHECK (compliance >= 1 AND compliance <= 5),
  average_score NUMERIC GENERATED ALWAYS AS ((accuracy + completeness + actionability + compliance) / 4.0) STORED,
  is_blind BOOLEAN DEFAULT TRUE,
  cleared_gate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);