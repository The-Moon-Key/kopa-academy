# KOPA Academy — Implementation Plan

> Derived from PRD v2.3, Technical Design v2.3, Learning Design v2.3, and Pre-Build Checklist v2.3.
> Read alongside: `01_KOPA_Academy_PRD-4.pdf`, `02_KOPA_Academy_Learning_Design-4.pdf`, `03_KOPA_Academy_Technical_Design-4.pdf`, `00_KOPA_Academy_PreBuild_Checklist.pdf`

---

## Current State

The repo contains the scaffolded React/Vite SPA, full Supabase SQL schema (21 tables, 68 RLS policies, CHECK constraints, triggers), seed data (10 projects, 59 layers, 78 KC questions, 44 competencies), Edge Function stubs, and Netlify config. All code is TypeScript with Tailwind CSS.

**What exists:**
- Project scaffolding (React + Vite + TypeScript + Tailwind + Zustand + React Router)
- Supabase client setup with auth hooks
- SQL migration with all tables, RLS policies, CHECK constraints, views, and triggers
- Seed data SQL for all curriculum content
- Page shells for all 16 views (apprentice, coach, admin)
- Shared components (Layout, StatusBadge, TierBadge, EmptyState)
- Edge Function stubs for AI assistant and evaluator
- Netlify deployment config

**What needs to be done:** Wire everything to a live Supabase instance, implement real data flows, build out the full UI interactions, and connect AI features.

---

## Phase 1: Core (Weeks 1–3)

_Goal: Full project/layer/submission/review loop working end-to-end._

### 1.1 Supabase Project Setup
- [ ] Create Supabase project
- [ ] Run `001_initial_schema.sql` migration
- [ ] Run `seed.sql` to populate curriculum data
- [ ] Verify all 21 tables, RLS policies, and triggers are active
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- [ ] Create admin account via Supabase Auth dashboard
- [ ] Create test coach and apprentice accounts
- [ ] Verify profile auto-creation trigger works on sign-up

### 1.2 Authentication & Profiles
- [ ] Wire `LoginPage.tsx` to Supabase Auth (email/password sign-in)
- [ ] Implement sign-up flow (create auth user → auto-create profile row)
- [ ] Add role-based route protection (redirect based on `profiles.role`)
- [ ] Display user info and role badge in Layout header
- [ ] Handle auth state persistence (session refresh)
- [ ] Add sign-out functionality

### 1.3 Apprentice Dashboard (Real Data)
- [ ] Fetch current project/layer from `profiles` table
- [ ] Fetch competency progress from `competency_progress` table
- [ ] Calculate and display domain-level summaries (effective tiers)
- [ ] Build journey map component showing all 10 projects with live status
- [ ] Show recent activity feed (latest submissions + reviews)
- [ ] Wire "Continue Learning" to current layer

### 1.4 Project & Layer Views (Real Data)
- [ ] Fetch all 10 projects with sort order
- [ ] Determine per-project status for current apprentice:
  - `completed` — all layers have passed attempts
  - `current` — has at least one layer available
  - `locked` — previous project not complete
- [ ] Project detail: fetch layers for project, determine per-layer status using `apprentice_layer_status` view
- [ ] Layer detail: show description, previous feedback (from view), submission form
- [ ] For P8-9: fetch and display personalised brief from `apprentice_project_briefs`

### 1.5 Submission Flow
- [ ] Build submission form: GitHub URL (conditional on `layer.requires_github`), notes (required), attachments
- [ ] Implement file upload to Supabase Storage (attachments bucket)
- [ ] Application-level validation: reject if `requires_github=true` and no URL provided
- [ ] Create immutable `submission_attempts` row on submit
- [ ] Auto-increment `attempt_number` per (apprentice, layer)
- [ ] Show pending state after submission
- [ ] Display latest review feedback (persists across attempts per the feedback view)

### 1.6 Coach Review Flow
- [ ] Build pending review queue: fetch `submission_attempts` with `status='pending'` for assigned apprentices
- [ ] Sort by `created_at` (oldest first for SLA tracking)
- [ ] Show time-since-submission for SLA visibility
- [ ] Build review form:
  - Rubric: Correctness, Security, Quality, Understanding — each with Strong/Adequate/Needs Work/N/A
  - Decision: Pass / Revise / Fail (radio)
  - Feedback: required textarea
  - `tool_adoption_verified` checkbox (P5-9 only)
  - `tool_adoption_details` textarea (when verified)
- [ ] Insert `submission_reviews` row on submit
- [ ] Verify trigger fires to update `submission_attempts.status`
- [ ] Verify trigger fires to update `profiles.current_project_id` / `current_layer_id` on pass
- [ ] Verify practical tier updates in `competency_progress` on pass

### 1.7 Retake Warning UX
- [ ] On KC retake: check current result for the question
- [ ] If current result is "Pass": show modal warning with explicit confirm button
- [ ] If "Developing" / "Not Yet" / no previous: no warning needed
- [ ] Warning text: "Your current result is Pass. Starting a new attempt will replace this. Your new result will become your current one, even if it's lower. Are you sure?"

### 1.8 Dashboard & Netlify Deploy
- [ ] Verify full loop: login → dashboard → project → layer → submit → coach review → status update
- [ ] Configure Netlify deployment (connect repo, set env vars)
- [ ] Verify SPA routing works in production (all routes → index.html)
- [ ] Test on `academy.kopamarket.io` (or staging URL)

---

## Phase 2: AI (Weeks 4–5)

_Goal: AI assistant and knowledge check conversations working end-to-end._

### 2.1 AI Assistant Edge Function
- [ ] Implement `supabase/functions/ai-assistant/index.ts`:
  - Verify JWT from request
  - Load apprentice profile, current project/layer context from DB
  - Load active assistant prompt from `ai_prompt_versions` (persona='assistant')
  - Fetch conversation history from `assistant_messages`
  - Call Claude API with system prompt + context + history
  - Store assistant response in `assistant_messages`
  - Return response to client
- [ ] Set `ANTHROPIC_API_KEY` as Supabase secret
- [ ] Build chat UI component for AI assistant (message list + input)
- [ ] Wire to Edge Function via `supabase.functions.invoke()`
- [ ] Store conversations in `assistant_conversations` + `assistant_messages`
- [ ] Show loading state during API call
- [ ] Handle errors gracefully (Claude downtime, rate limits)

### 2.2 AI Knowledge Check Evaluator Edge Function
- [ ] Implement `supabase/functions/ai-evaluator/index.ts`:
  - Verify JWT
  - Load question text + variant phrasings
  - Load active evaluator prompt from `ai_prompt_versions` (persona='evaluator')
  - Select variant phrasing (random from array) for reliability
  - Build conversation with system prompt + question + apprentice messages
  - Call Claude API
  - Parse verdict: detect pass/developing/not_yet from response
  - Store in `knowledge_check_sessions` (result, result_source='ai', model_version)
  - Store messages in `knowledge_check_messages`
  - Return response
- [ ] Record `model_version` and `prompt_version_id` on every AI session

### 2.3 Knowledge Check UI
- [ ] Build KC session page: chat interface with question display
- [ ] Load available questions per project (from `knowledge_check_questions` via layer)
- [ ] Show current result status per question (pass/developing/not_yet/null)
- [ ] Implement retake flow with warning modal (if current = pass)
- [ ] Mark old sessions as `is_current=false` when new session starts (verify trigger)
- [ ] Display result badge after evaluation completes
- [ ] Show attempt count per question

### 2.4 Coach Transcript Viewer
- [ ] Build transcript list: all KC sessions for assigned apprentices
- [ ] Show session details: question, all messages, result, result_source
- [ ] Filter by apprentice, project, result
- [ ] Display attempt count and current status per question

---

## Phase 3: Competency (Weeks 6–7)

_Goal: Competency engine fully operational with portfolio._

### 3.1 Competency Engine
- [ ] Verify `knowledge_tier` trigger logic:
  - For each competency, find the highest tier where ALL mapped questions have `is_current` session with `result='pass'`
  - Handle dual-mapped questions (2 questions with multiple competency mappings)
  - Handle the ALL-must-pass rule across projects (e.g., Secret Management Foundations needs pass in both P0 and P1)
  - Verify tier can decrease on retake
- [ ] Verify `practical_tier` updates on layer pass (only increases)
- [ ] Verify `effective_tier` generated column = LEAST(practical, knowledge)
- [ ] Write integration tests for tier calculation edge cases

### 3.2 Override & Manual Scoring
- [ ] Admin KC override flow:
  - Select session to override
  - Enter override_reason (required — DB CHECK enforced)
  - Store original_result, override_reason, overridden_by
  - result_source = 'manual_admin'
- [ ] Coach manual scoring flow:
  - Coach enters result manually (verbal check)
  - coach_notes required (DB CHECK enforced)
  - result_source = 'manual_coach'
- [ ] Verify CHECK constraints fire correctly on invalid data

### 3.3 Portfolio Page (Real Data)
- [ ] Fetch all 44 competencies grouped by 10 domains
- [ ] Display practical_tier, knowledge_tier, effective_tier per competency
- [ ] Color-code tiers: 0=none(grey), 1=foundations(blue), 2=practitioner(amber), 3=mastery(green)
- [ ] Calculate and display KC pass rate per domain
- [ ] Fetch and display GitHub links per project from `project_github_links`
- [ ] Allow apprentice to add/edit GitHub links
- [ ] Show overall progress metrics

---

## Phase 4: Ops (Weeks 8–9)

_Goal: Operational tooling, notifications, and analytics._

### 4.1 Coach Dashboard Enhancements
- [ ] SLA tracking: highlight reviews approaching 48h
- [ ] Filter/sort pending queue by project, apprentice, age
- [ ] Apprentice detail view: full progress, all submissions, all KC results
- [ ] Bulk review capabilities (if needed)

### 4.2 Tool Adoption Tracking
- [ ] Show `tool_adoption_verified` field on review form (P5-9 submissions only)
- [ ] Track and display adoption metrics per apprentice
- [ ] Admin view: tool adoption summary across cohort

### 4.3 Notifications
- [ ] Insert notification rows on key events:
  - Submission received (→ coach)
  - Review completed (→ apprentice)
  - KC override (→ apprentice)
  - Personalised brief assigned (→ apprentice)
- [ ] Notification bell in header with unread count
- [ ] Notification list page/dropdown
- [ ] Mark as read functionality
- [ ] Optional: email notifications (via Supabase Edge Function + email service)

### 4.4 AI Prompt Versioning
- [ ] Admin UI for managing `ai_prompt_versions`:
  - View all versions per persona (assistant, evaluator)
  - Create new version (prompt_text, model_version)
  - Set active version (one per persona)
  - View version history
- [ ] Ensure new KC sessions use the currently active prompt version
- [ ] Store prompt_version_id on every session for audit trail

### 4.5 Analytics
- [ ] Programme completion rate (% of starters who finish P9)
- [ ] Time to first deploy (P1 completion time from start)
- [ ] Coach review turnaround (time to first review per attempt)
- [ ] KC engagement rate (% of checks attempted per apprentice)
- [ ] Competency coverage (% at Practitioner+ effective per completer)
- [ ] Tool adoption rate (P5-9)

### 4.6 Audit Log
- [ ] Wire audit log inserts to key actions:
  - Role changes, coach reassignment
  - KC overrides
  - Prompt version changes
  - Account creation/deletion
- [ ] Admin audit log viewer with filters (actor, action, entity_type, date range)

### 4.7 Realtime Updates
- [ ] Supabase Realtime subscription for coach pending queue (new submissions appear live)
- [ ] Realtime notification delivery
- [ ] Realtime status updates on apprentice dashboard

---

## Future (Post-Launch)

_From PRD Section 8. Not scheduled yet._

- [ ] Community board
- [ ] Multi-cohort support + cohort-scoped content versioning
- [ ] Content editor (respects freeze boundaries)
- [ ] Stretch challenges
- [ ] Peer review
- [ ] PDF export of portfolio
- [ ] In-platform appeals (replacing Slack-based v1 process)
- [ ] Advanced analytics dashboard

---

## Key Decisions (from Pre-Build Checklist)

These are locked and must not change during implementation:

1. **State enums**: Three distinct enums — Coach Review Decision, Attempt Status, Apprentice Layer State. No synonyms.
2. **Content freeze**: Seeded curriculum frozen when cohort starts. Custom P8-9 questions are the explicit exception.
3. **Apprentice project briefs**: First-class `apprentice_project_briefs` table for P8-9 personalised briefs.
4. **CHECK constraints**: Mandatory fields enforced at DB level for manual_coach, manual_admin, and ai result sources.
5. **Retake warning**: UI must show unmissable warning before retaking a passed KC question.
6. **KC coverage**: 78 questions, 80 competency-question pairs, 44/44 competencies covered.
7. **Day-1 seed data**: All curriculum content must be seeded before first apprentice login.

---

## Launch Criteria (from PRD)

- [ ] Full project/layer/submission/review loop
- [ ] AI assistant + knowledge checks (78 questions, 44 competencies)
- [ ] Competency map updates (practical + knowledge tiers)
- [ ] RLS enforced: own data (apprentice), assigned (coach)

## Success Metrics (Post-Launch)

| Metric | Target |
|--------|--------|
| Programme completion | >70% of starters finish P9 |
| Time to first deploy | P1 within 2 weeks |
| Coach review turnaround | <48h to first review |
| KC engagement | >60% of checks attempted per apprentice |
| Competency coverage | Completers at Practitioner+ in >80% of competencies |
| Tool adoption | ≥1 tool per apprentice (P5-9) used by non-apprentice |
