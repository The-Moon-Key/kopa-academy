export type UserRole = 'apprentice' | 'coach' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  cohort_id: string | null;
  assigned_coach_id: string | null;
  current_project_id: number | null;
  current_layer_id: number | null;
  created_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  started_at: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  subtitle: string | null;
  brief: string;
  sort_order: number;
}

export interface Layer {
  id: number;
  project_id: number;
  name: string;
  description: string;
  sort_order: number;
  requires_github: boolean;
  tier_level: number;
}

export interface ApprenticeProjectBrief {
  id: number;
  apprentice_id: string;
  project_id: number;
  brief_text: string;
  created_by: string;
  created_at: string;
}

export interface SubmissionAttempt {
  id: string;
  apprentice_id: string;
  layer_id: number;
  attempt_number: number;
  github_url: string | null;
  github_ref: string | null;
  notes: string;
  attachment_paths: string[] | null;
  status: 'pending' | 'passed' | 'revision' | 'failed';
  created_at: string;
}

export interface SubmissionReview {
  id: string;
  attempt_id: string;
  coach_id: string;
  decision: 'passed' | 'revision' | 'failed';
  rubric_correctness: RubricRating | null;
  rubric_security: RubricRating | null;
  rubric_quality: RubricRating | null;
  rubric_understanding: RubricRating | null;
  feedback: string;
  tool_adoption_verified: boolean | null;
  tool_adoption_details: string | null;
  created_at: string;
}

export type RubricRating = 'strong' | 'adequate' | 'needs_work' | 'n_a';

export interface KnowledgeCheckQuestion {
  id: number;
  layer_id: number;
  question_text: string;
  variant_phrasings: string[] | null;
  is_custom: boolean;
  created_by: string | null;
  apprentice_id: string | null;
}

export interface KnowledgeCheckSession {
  id: string;
  apprentice_id: string;
  question_id: number;
  attempt_number: number;
  is_current: boolean;
  result: 'pass' | 'developing' | 'not_yet' | null;
  result_source: 'ai' | 'manual_coach' | 'manual_admin';
  original_result: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  model_version: string | null;
  prompt_version_id: string | null;
  coach_notes: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface KnowledgeCheckMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  created_at: string;
}

export interface CompetencyProgress {
  id: number;
  apprentice_id: string;
  competency_id: number;
  practical_tier: number;
  knowledge_tier: number;
  effective_tier: number;
  updated_at: string;
}

export interface SkillDomain {
  id: number;
  name: string;
  sort_order: number;
}

export interface Competency {
  id: number;
  domain_id: number;
  name: string;
  desc_foundations: string | null;
  desc_practitioner: string | null;
  desc_mastery: string | null;
}

export interface AIPromptVersion {
  id: string;
  persona: 'assistant' | 'evaluator';
  prompt_text: string;
  model_version: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface ProjectGithubLink {
  id: number;
  apprentice_id: string;
  project_id: number;
  github_url: string;
  label: string | null;
  created_at: string;
}

export interface AssistantConversation {
  id: string;
  apprentice_id: string;
  project_id: number;
  layer_id: number;
  created_at: string;
}

export interface AssistantMessage {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  created_at: string;
}

export type LayerStatus = 'locked' | 'current' | 'pending' | 'revision_needed' | 'failed' | 'completed';

export interface ApprenticeLayerStatus {
  layer_id: number;
  layer_name: string;
  project_id: number;
  current_attempt_status: string | null;
  current_attempt_number: number | null;
  latest_review_feedback: string | null;
  latest_review_decision: string | null;
  latest_review_at: string | null;
}
