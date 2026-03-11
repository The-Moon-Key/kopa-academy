-- ============================================================================
-- KOPA Academy — Initial Schema Migration
-- ============================================================================
-- This migration creates the complete database schema for the KOPA Academy
-- platform including tables, views, triggers, indexes, and RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 cohorts
-- ----------------------------------------------------------------------------
CREATE TABLE cohorts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    started_at  DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.2 projects
-- ----------------------------------------------------------------------------
CREATE TABLE projects (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    subtitle    TEXT,
    brief       TEXT NOT NULL,
    sort_order  INT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 1.3 profiles (self-ref FK and current_layer_id FK added later via ALTER)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id                 UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name          TEXT NOT NULL,
    role               TEXT CHECK (role IN ('apprentice', 'coach', 'admin')),
    cohort_id          UUID REFERENCES cohorts ON DELETE SET NULL,
    assigned_coach_id  UUID REFERENCES profiles ON DELETE SET NULL,
    current_project_id INT REFERENCES projects ON DELETE SET NULL,
    current_layer_id   INT,  -- FK added after layers table exists
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.4 layers
-- ----------------------------------------------------------------------------
CREATE TABLE layers (
    id              SERIAL PRIMARY KEY,
    project_id      INT NOT NULL REFERENCES projects ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    sort_order      INT NOT NULL,
    requires_github BOOLEAN NOT NULL DEFAULT true,
    tier_level      INT CHECK (tier_level BETWEEN 1 AND 3)
);

-- Now add the deferred FK from profiles → layers
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_current_layer_id
    FOREIGN KEY (current_layer_id) REFERENCES layers (id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 1.5 apprentice_project_briefs
-- ----------------------------------------------------------------------------
CREATE TABLE apprentice_project_briefs (
    id             SERIAL PRIMARY KEY,
    apprentice_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    project_id     INT NOT NULL REFERENCES projects ON DELETE CASCADE,
    brief_text     TEXT NOT NULL,
    created_by     UUID NOT NULL REFERENCES profiles ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.6 submission_attempts
-- ----------------------------------------------------------------------------
CREATE TABLE submission_attempts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    layer_id         INT NOT NULL REFERENCES layers ON DELETE CASCADE,
    attempt_number   INT NOT NULL,
    github_url       TEXT,
    github_ref       TEXT,
    notes            TEXT NOT NULL,
    attachment_paths TEXT[],
    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'passed', 'revision', 'failed')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (apprentice_id, layer_id, attempt_number)
);

-- ----------------------------------------------------------------------------
-- 1.7 submission_reviews
-- ----------------------------------------------------------------------------
CREATE TABLE submission_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id              UUID NOT NULL REFERENCES submission_attempts ON DELETE CASCADE,
    coach_id                UUID NOT NULL REFERENCES profiles ON DELETE SET NULL,
    decision                TEXT NOT NULL CHECK (decision IN ('passed', 'revision', 'failed')),
    rubric_correctness      TEXT CHECK (rubric_correctness IN ('strong', 'adequate', 'needs_work', 'n_a')),
    rubric_security         TEXT CHECK (rubric_security IN ('strong', 'adequate', 'needs_work', 'n_a')),
    rubric_quality          TEXT CHECK (rubric_quality IN ('strong', 'adequate', 'needs_work', 'n_a')),
    rubric_understanding    TEXT CHECK (rubric_understanding IN ('strong', 'adequate', 'needs_work', 'n_a')),
    feedback                TEXT NOT NULL,
    tool_adoption_verified  BOOLEAN,
    tool_adoption_details   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.8 skill_domains
-- ----------------------------------------------------------------------------
CREATE TABLE skill_domains (
    id         SERIAL PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL,
    sort_order INT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 1.9 competencies
-- ----------------------------------------------------------------------------
CREATE TABLE competencies (
    id                SERIAL PRIMARY KEY,
    domain_id         INT NOT NULL REFERENCES skill_domains ON DELETE CASCADE,
    name              TEXT NOT NULL,
    desc_foundations   TEXT,
    desc_practitioner  TEXT,
    desc_mastery       TEXT
);

-- ----------------------------------------------------------------------------
-- 1.10 layer_competencies (junction)
-- ----------------------------------------------------------------------------
CREATE TABLE layer_competencies (
    layer_id      INT NOT NULL REFERENCES layers ON DELETE CASCADE,
    competency_id INT NOT NULL REFERENCES competencies ON DELETE CASCADE,
    tier          INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    PRIMARY KEY (layer_id, competency_id)
);

-- ----------------------------------------------------------------------------
-- 1.11 knowledge_check_questions
-- ----------------------------------------------------------------------------
CREATE TABLE knowledge_check_questions (
    id                SERIAL PRIMARY KEY,
    layer_id          INT NOT NULL REFERENCES layers ON DELETE CASCADE,
    question_text     TEXT NOT NULL,
    variant_phrasings TEXT[],
    is_custom         BOOLEAN NOT NULL DEFAULT false,
    created_by        UUID REFERENCES profiles ON DELETE SET NULL,
    apprentice_id     UUID REFERENCES profiles ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 1.12 question_competencies (junction)
-- ----------------------------------------------------------------------------
CREATE TABLE question_competencies (
    question_id   INT NOT NULL REFERENCES knowledge_check_questions ON DELETE CASCADE,
    competency_id INT NOT NULL REFERENCES competencies ON DELETE CASCADE,
    tier          INT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    PRIMARY KEY (question_id, competency_id)
);

-- ----------------------------------------------------------------------------
-- 1.13 ai_prompt_versions
-- ----------------------------------------------------------------------------
CREATE TABLE ai_prompt_versions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona        TEXT CHECK (persona IN ('assistant', 'evaluator')),
    prompt_text    TEXT NOT NULL,
    model_version  TEXT NOT NULL,
    version        INT NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT false,
    created_by     UUID REFERENCES profiles ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.14 knowledge_check_sessions
-- ----------------------------------------------------------------------------
CREATE TABLE knowledge_check_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    question_id       INT NOT NULL REFERENCES knowledge_check_questions ON DELETE CASCADE,
    attempt_number    INT NOT NULL,
    is_current        BOOLEAN NOT NULL DEFAULT true,
    result            TEXT CHECK (result IN ('pass', 'developing', 'not_yet')),
    result_source     TEXT NOT NULL DEFAULT 'ai'
                      CHECK (result_source IN ('ai', 'manual_coach', 'manual_admin')),
    original_result   TEXT,
    override_reason   TEXT,
    overridden_by     UUID REFERENCES profiles ON DELETE SET NULL,
    model_version     TEXT,
    prompt_version_id UUID REFERENCES ai_prompt_versions ON DELETE SET NULL,
    coach_notes       TEXT,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,

    -- Conditional CHECK constraints
    CONSTRAINT chk_manual_coach_needs_notes
        CHECK (result_source != 'manual_coach' OR coach_notes IS NOT NULL),
    CONSTRAINT chk_manual_admin_needs_override_info
        CHECK (result_source != 'manual_admin' OR (
            override_reason IS NOT NULL
            AND overridden_by IS NOT NULL
            AND original_result IS NOT NULL
        )),
    CONSTRAINT chk_ai_needs_model_version
        CHECK (result_source != 'ai' OR model_version IS NOT NULL)
);

-- ----------------------------------------------------------------------------
-- 1.15 knowledge_check_messages
-- ----------------------------------------------------------------------------
CREATE TABLE knowledge_check_messages (
    id         SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES knowledge_check_sessions ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    sequence   INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.16 competency_progress
-- ----------------------------------------------------------------------------
CREATE TABLE competency_progress (
    id              SERIAL PRIMARY KEY,
    apprentice_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    competency_id   INT NOT NULL REFERENCES competencies ON DELETE CASCADE,
    practical_tier  INT NOT NULL DEFAULT 0,
    knowledge_tier  INT NOT NULL DEFAULT 0,
    effective_tier  INT GENERATED ALWAYS AS (LEAST(practical_tier, knowledge_tier)) STORED,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (apprentice_id, competency_id)
);

-- ----------------------------------------------------------------------------
-- 1.17 assistant_conversations
-- ----------------------------------------------------------------------------
CREATE TABLE assistant_conversations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    project_id    INT REFERENCES projects ON DELETE SET NULL,
    layer_id      INT REFERENCES layers ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.18 assistant_messages
-- ----------------------------------------------------------------------------
CREATE TABLE assistant_messages (
    id              SERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES assistant_conversations ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    sequence        INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.19 project_github_links
-- ----------------------------------------------------------------------------
CREATE TABLE project_github_links (
    id            SERIAL PRIMARY KEY,
    apprentice_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    project_id    INT NOT NULL REFERENCES projects ON DELETE CASCADE,
    github_url    TEXT NOT NULL,
    label         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.20 audit_log
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id          SERIAL PRIMARY KEY,
    actor_id    UUID REFERENCES profiles ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.21 notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
    type           TEXT NOT NULL,
    reference_type TEXT,
    reference_id   TEXT,
    is_read        BOOLEAN NOT NULL DEFAULT false,
    email_sent     BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_submission_attempts_apprentice_layer
    ON submission_attempts (apprentice_id, layer_id);

CREATE INDEX idx_submission_reviews_attempt
    ON submission_reviews (attempt_id);

CREATE INDEX idx_kc_sessions_apprentice_question_current
    ON knowledge_check_sessions (apprentice_id, question_id, is_current);

CREATE INDEX idx_competency_progress_apprentice
    ON competency_progress (apprentice_id);

CREATE INDEX idx_notifications_recipient_read
    ON notifications (recipient_id, is_read);

CREATE INDEX idx_audit_log_actor
    ON audit_log (actor_id);

CREATE INDEX idx_layers_project_sort
    ON layers (project_id, sort_order);


-- ============================================================================
-- 3. VIEWS
-- ============================================================================

-- apprentice_layer_status
-- Joins layers with the latest attempt per (apprentice, layer) and
-- the latest review across ALL attempts for that apprentice+layer.
CREATE OR REPLACE VIEW apprentice_layer_status
WITH (security_invoker = true)
AS
SELECT
    sa.apprentice_id,
    l.id                    AS layer_id,
    l.name                  AS layer_name,
    l.project_id,
    sa.status               AS current_attempt_status,
    sa.attempt_number       AS current_attempt_number,
    lr.feedback             AS latest_review_feedback,
    lr.decision             AS latest_review_decision,
    lr.created_at           AS latest_review_at
FROM layers l
-- Latest attempt per apprentice+layer
INNER JOIN LATERAL (
    SELECT sa2.*
    FROM submission_attempts sa2
    WHERE sa2.layer_id = l.id
    ORDER BY sa2.attempt_number DESC
    LIMIT 1
) sa ON true
-- Latest review across ALL attempts for this apprentice+layer
LEFT JOIN LATERAL (
    SELECT sr2.feedback, sr2.decision, sr2.created_at
    FROM submission_reviews sr2
    INNER JOIN submission_attempts sa3
        ON sr2.attempt_id = sa3.id
    WHERE sa3.apprentice_id = sa.apprentice_id
      AND sa3.layer_id = l.id
    ORDER BY sr2.created_at DESC
    LIMIT 1
) lr ON true;


-- ============================================================================
-- 4. TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 update_attempt_status_on_review
-- When a submission_review is inserted, set the parent attempt's status
-- to the review's decision.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_attempt_status_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE submission_attempts
    SET status = NEW.decision
    WHERE id = NEW.attempt_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_attempt_status_on_review
    AFTER INSERT ON submission_reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_attempt_status_on_review();

-- ----------------------------------------------------------------------------
-- 4.2 recalculate_competency_progress
-- When a review with decision='passed' is inserted, check if all layers
-- mapped to each competency (at a given tier) are passed for the apprentice,
-- then update practical_tier accordingly.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_competency_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_apprentice_id UUID;
    v_layer_id      INT;
    rec             RECORD;
BEGIN
    -- Only act on passed reviews
    IF NEW.decision != 'passed' THEN
        RETURN NEW;
    END IF;

    -- Get the apprentice_id and layer_id from the attempt
    SELECT sa.apprentice_id, sa.layer_id
    INTO v_apprentice_id, v_layer_id
    FROM submission_attempts sa
    WHERE sa.id = NEW.attempt_id;

    -- For each competency+tier mapped to this layer, check if all layers
    -- at that tier are passed for this apprentice
    FOR rec IN
        SELECT lc.competency_id, lc.tier
        FROM layer_competencies lc
        WHERE lc.layer_id = v_layer_id
    LOOP
        -- Check: are ALL layers for this competency at this tier passed?
        IF NOT EXISTS (
            SELECT 1
            FROM layer_competencies lc2
            INNER JOIN layers l2 ON l2.id = lc2.layer_id
            WHERE lc2.competency_id = rec.competency_id
              AND lc2.tier = rec.tier
              AND NOT EXISTS (
                  SELECT 1
                  FROM submission_attempts sa2
                  WHERE sa2.apprentice_id = v_apprentice_id
                    AND sa2.layer_id = lc2.layer_id
                    AND sa2.status = 'passed'
              )
        ) THEN
            -- All layers passed for this competency at this tier —
            -- update practical_tier if it would increase
            INSERT INTO competency_progress (apprentice_id, competency_id, practical_tier, updated_at)
            VALUES (v_apprentice_id, rec.competency_id, rec.tier, now())
            ON CONFLICT (apprentice_id, competency_id)
            DO UPDATE SET
                practical_tier = GREATEST(competency_progress.practical_tier, rec.tier),
                updated_at = now();
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalculate_competency_progress
    AFTER INSERT ON submission_reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_recalculate_competency_progress();

-- ----------------------------------------------------------------------------
-- 4.3 manage_kc_session_is_current
-- When a new knowledge_check_session is inserted, mark all previous sessions
-- for the same apprentice+question as is_current = false.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_manage_kc_session_is_current()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE knowledge_check_sessions
    SET is_current = false
    WHERE apprentice_id = NEW.apprentice_id
      AND question_id  = NEW.question_id
      AND id != NEW.id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_manage_kc_session_is_current
    AFTER INSERT ON knowledge_check_sessions
    FOR EACH ROW
    EXECUTE FUNCTION fn_manage_kc_session_is_current();

-- ----------------------------------------------------------------------------
-- 4.4 create_profile_on_signup
-- When a new row is inserted into auth.users, automatically create a
-- profiles row with the user's metadata.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'apprentice')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- 5. ROW LEVEL SECURITY — Enable on all tables
-- ============================================================================

ALTER TABLE cohorts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE layers                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_project_briefs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_domains              ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_competencies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_check_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_competencies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_check_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_check_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_github_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 5.1 Helper function: get current user's role
-- ============================================================================
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: check if the current user is the assigned coach for a given apprentice
CREATE OR REPLACE FUNCTION is_assigned_coach(p_apprentice_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_apprentice_id
          AND assigned_coach_id = auth.uid()
    );
$$;


-- ============================================================================
-- 5.2 RLS Policies
-- ============================================================================

-- -------------------------------------------------------
-- profiles
-- Apprentice: R/U own | Coach: R/U own | Admin: R/U/D
-- -------------------------------------------------------
CREATE POLICY profiles_select ON profiles
    FOR SELECT USING (
        id = auth.uid()
        OR auth_role() = 'admin'
        OR (auth_role() = 'coach' AND assigned_coach_id = auth.uid())
        OR (auth_role() = 'apprentice' AND id = auth.uid())
    );

CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (
        id = auth.uid()
        OR auth_role() = 'admin'
    );

CREATE POLICY profiles_delete ON profiles
    FOR DELETE USING (
        auth_role() = 'admin'
    );

-- Allow insert for the signup trigger (runs as SECURITY DEFINER)
-- and for admins creating profiles
CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (
        id = auth.uid()
        OR auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- cohorts — Authenticated users can read; admins can write
-- -------------------------------------------------------
CREATE POLICY cohorts_select ON cohorts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY cohorts_insert ON cohorts
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY cohorts_update ON cohorts
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY cohorts_delete ON cohorts
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- projects — Content: R all authenticated | W admin
-- -------------------------------------------------------
CREATE POLICY projects_select ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY projects_insert ON projects
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY projects_update ON projects
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY projects_delete ON projects
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- layers — Content: R all authenticated | W admin
-- -------------------------------------------------------
CREATE POLICY layers_select ON layers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY layers_insert ON layers
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY layers_update ON layers
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY layers_delete ON layers
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- skill_domains — Content: R all authenticated | W admin
-- -------------------------------------------------------
CREATE POLICY skill_domains_select ON skill_domains
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY skill_domains_insert ON skill_domains
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY skill_domains_update ON skill_domains
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY skill_domains_delete ON skill_domains
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- competencies — Content: R all authenticated | W admin
-- -------------------------------------------------------
CREATE POLICY competencies_select ON competencies
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY competencies_insert ON competencies
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY competencies_update ON competencies
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY competencies_delete ON competencies
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- layer_competencies — Content: R all authenticated | W admin
-- -------------------------------------------------------
CREATE POLICY layer_competencies_select ON layer_competencies
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY layer_competencies_insert ON layer_competencies
    FOR INSERT WITH CHECK (auth_role() = 'admin');

CREATE POLICY layer_competencies_update ON layer_competencies
    FOR UPDATE USING (auth_role() = 'admin');

CREATE POLICY layer_competencies_delete ON layer_competencies
    FOR DELETE USING (auth_role() = 'admin');

-- -------------------------------------------------------
-- apprentice_project_briefs
-- Apprentice: R own | Coach: R/W assigned | Admin: R/W
-- -------------------------------------------------------
CREATE POLICY apb_select ON apprentice_project_briefs
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY apb_insert ON apprentice_project_briefs
    FOR INSERT WITH CHECK (
        (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY apb_update ON apprentice_project_briefs
    FOR UPDATE USING (
        (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY apb_delete ON apprentice_project_briefs
    FOR DELETE USING (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- submission_attempts
-- Apprentice: R/C own | Coach: R assigned | Admin: R
-- -------------------------------------------------------
CREATE POLICY sa_select ON submission_attempts
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY sa_insert ON submission_attempts
    FOR INSERT WITH CHECK (
        auth_role() = 'apprentice' AND apprentice_id = auth.uid()
    );

-- -------------------------------------------------------
-- submission_reviews
-- Apprentice: — | Coach: R/C assigned | Admin: R/C/U
-- -------------------------------------------------------
CREATE POLICY sr_select ON submission_reviews
    FOR SELECT USING (
        (auth_role() = 'coach' AND EXISTS (
            SELECT 1 FROM submission_attempts sa
            WHERE sa.id = submission_reviews.attempt_id
              AND is_assigned_coach(sa.apprentice_id)
        ))
        OR auth_role() = 'admin'
        -- Apprentices can also read reviews on their own attempts (for feedback)
        OR (auth_role() = 'apprentice' AND EXISTS (
            SELECT 1 FROM submission_attempts sa
            WHERE sa.id = submission_reviews.attempt_id
              AND sa.apprentice_id = auth.uid()
        ))
    );

CREATE POLICY sr_insert ON submission_reviews
    FOR INSERT WITH CHECK (
        (auth_role() = 'coach' AND coach_id = auth.uid() AND EXISTS (
            SELECT 1 FROM submission_attempts sa
            WHERE sa.id = attempt_id
              AND is_assigned_coach(sa.apprentice_id)
        ))
        OR (auth_role() = 'admin' AND coach_id = auth.uid())
    );

CREATE POLICY sr_update ON submission_reviews
    FOR UPDATE USING (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- knowledge_check_questions
-- Coach: R + C custom for assigned | Admin: R/C/U
-- -------------------------------------------------------
CREATE POLICY kcq_select ON knowledge_check_questions
    FOR SELECT USING (
        auth_role() IN ('coach', 'admin')
        OR (auth_role() = 'apprentice' AND (
            is_custom = false
            OR apprentice_id = auth.uid()
        ))
    );

CREATE POLICY kcq_insert ON knowledge_check_questions
    FOR INSERT WITH CHECK (
        (auth_role() = 'coach' AND is_custom = true
            AND created_by = auth.uid()
            AND apprentice_id IS NOT NULL
            AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY kcq_update ON knowledge_check_questions
    FOR UPDATE USING (
        auth_role() = 'admin'
    );

CREATE POLICY kcq_delete ON knowledge_check_questions
    FOR DELETE USING (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- question_competencies
-- Coach: C for own custom Qs | Admin: R/C/U
-- -------------------------------------------------------
CREATE POLICY qc_select ON question_competencies
    FOR SELECT USING (
        auth_role() IN ('coach', 'admin')
        OR auth_role() = 'apprentice'
    );

CREATE POLICY qc_insert ON question_competencies
    FOR INSERT WITH CHECK (
        (auth_role() = 'coach' AND EXISTS (
            SELECT 1 FROM knowledge_check_questions kcq
            WHERE kcq.id = question_id
              AND kcq.created_by = auth.uid()
              AND kcq.is_custom = true
        ))
        OR auth_role() = 'admin'
    );

CREATE POLICY qc_update ON question_competencies
    FOR UPDATE USING (
        auth_role() = 'admin'
    );

CREATE POLICY qc_delete ON question_competencies
    FOR DELETE USING (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- knowledge_check_sessions
-- Apprentice: R/C own | Coach: R assigned | Admin: R + Override
-- -------------------------------------------------------
CREATE POLICY kcs_select ON knowledge_check_sessions
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY kcs_insert ON knowledge_check_sessions
    FOR INSERT WITH CHECK (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR auth_role() = 'admin'
    );

-- Admin override: allow updating result_source, override fields
CREATE POLICY kcs_update ON knowledge_check_sessions
    FOR UPDATE USING (
        -- Apprentices can update their own in-progress sessions (AI flow)
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        -- Coaches can add notes to sessions of assigned apprentices
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        -- Admins can override results
        OR auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- knowledge_check_messages
-- Follow session access: if you can see the session, you can see messages
-- -------------------------------------------------------
CREATE POLICY kcm_select ON knowledge_check_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM knowledge_check_sessions kcs
            WHERE kcs.id = knowledge_check_messages.session_id
              AND (
                  (auth_role() = 'apprentice' AND kcs.apprentice_id = auth.uid())
                  OR (auth_role() = 'coach' AND is_assigned_coach(kcs.apprentice_id))
                  OR auth_role() = 'admin'
              )
        )
    );

CREATE POLICY kcm_insert ON knowledge_check_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM knowledge_check_sessions kcs
            WHERE kcs.id = session_id
              AND (
                  (auth_role() = 'apprentice' AND kcs.apprentice_id = auth.uid())
                  OR auth_role() = 'admin'
              )
        )
    );

-- -------------------------------------------------------
-- competency_progress
-- Apprentice: R own | Coach: R assigned | Admin: R
-- -------------------------------------------------------
CREATE POLICY cp_select ON competency_progress
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

-- Insert/Update handled by trigger (SECURITY DEFINER), not direct user access
-- But we allow the trigger functions to work via service role

-- -------------------------------------------------------
-- ai_prompt_versions
-- Admin only: R/W
-- -------------------------------------------------------
CREATE POLICY aipv_select ON ai_prompt_versions
    FOR SELECT USING (
        auth_role() = 'admin'
    );

CREATE POLICY aipv_insert ON ai_prompt_versions
    FOR INSERT WITH CHECK (
        auth_role() = 'admin'
    );

CREATE POLICY aipv_update ON ai_prompt_versions
    FOR UPDATE USING (
        auth_role() = 'admin'
    );

CREATE POLICY aipv_delete ON ai_prompt_versions
    FOR DELETE USING (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- audit_log — Admin: R only
-- -------------------------------------------------------
CREATE POLICY audit_log_select ON audit_log
    FOR SELECT USING (
        auth_role() = 'admin'
    );

-- Insert allowed by service role (edge functions) or admin
CREATE POLICY audit_log_insert ON audit_log
    FOR INSERT WITH CHECK (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- notifications
-- Apprentice: R own | Coach: R own | Admin: R
-- -------------------------------------------------------
CREATE POLICY notifications_select ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid()
        OR auth_role() = 'admin'
    );

CREATE POLICY notifications_update ON notifications
    FOR UPDATE USING (
        recipient_id = auth.uid()
        OR auth_role() = 'admin'
    );

CREATE POLICY notifications_insert ON notifications
    FOR INSERT WITH CHECK (
        auth_role() = 'admin'
    );

-- -------------------------------------------------------
-- project_github_links
-- Apprentice: R/C/U/D own | Coach: R assigned | Admin: R
-- -------------------------------------------------------
CREATE POLICY pgl_select ON project_github_links
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY pgl_insert ON project_github_links
    FOR INSERT WITH CHECK (
        auth_role() = 'apprentice' AND apprentice_id = auth.uid()
    );

CREATE POLICY pgl_update ON project_github_links
    FOR UPDATE USING (
        auth_role() = 'apprentice' AND apprentice_id = auth.uid()
    );

CREATE POLICY pgl_delete ON project_github_links
    FOR DELETE USING (
        auth_role() = 'apprentice' AND apprentice_id = auth.uid()
    );

-- -------------------------------------------------------
-- assistant_conversations
-- Apprentice: R/C own | Coach: R assigned | Admin: R
-- -------------------------------------------------------
CREATE POLICY ac_select ON assistant_conversations
    FOR SELECT USING (
        (auth_role() = 'apprentice' AND apprentice_id = auth.uid())
        OR (auth_role() = 'coach' AND is_assigned_coach(apprentice_id))
        OR auth_role() = 'admin'
    );

CREATE POLICY ac_insert ON assistant_conversations
    FOR INSERT WITH CHECK (
        auth_role() = 'apprentice' AND apprentice_id = auth.uid()
    );

-- -------------------------------------------------------
-- assistant_messages
-- Follow conversation access
-- -------------------------------------------------------
CREATE POLICY am_select ON assistant_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assistant_conversations ac
            WHERE ac.id = assistant_messages.conversation_id
              AND (
                  (auth_role() = 'apprentice' AND ac.apprentice_id = auth.uid())
                  OR (auth_role() = 'coach' AND is_assigned_coach(ac.apprentice_id))
                  OR auth_role() = 'admin'
              )
        )
    );

CREATE POLICY am_insert ON assistant_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM assistant_conversations ac
            WHERE ac.id = conversation_id
              AND (
                  (auth_role() = 'apprentice' AND ac.apprentice_id = auth.uid())
                  OR auth_role() = 'admin'
              )
        )
    );
