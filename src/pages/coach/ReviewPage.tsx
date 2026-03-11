import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { SubmissionAttempt, Profile, Layer, Project, RubricRating } from '../../types';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Github,
  FileText,
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Wrench,
} from 'lucide-react';

const rubricOptions: { value: RubricRating; label: string }[] = [
  { value: 'strong', label: 'Strong' },
  { value: 'adequate', label: 'Adequate' },
  { value: 'needs_work', label: 'Needs Work' },
  { value: 'n_a', label: 'N/A' },
];

const decisionOptions: { value: 'passed' | 'revision' | 'failed'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'passed', label: 'Pass', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-success-400 border-success-500/50 bg-success-500/10' },
  { value: 'revision', label: 'Revise', icon: <RotateCcw className="h-4 w-4" />, color: 'text-warning-400 border-warning-500/50 bg-warning-500/10' },
  { value: 'failed', label: 'Fail', icon: <XCircle className="h-4 w-4" />, color: 'text-danger-400 border-danger-500/50 bg-danger-500/10' },
];

export function ReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { profile } = useAppStore();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<SubmissionAttempt | null>(null);
  const [apprentice, setApprentice] = useState<Profile | null>(null);
  const [layer, setLayer] = useState<Layer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [decision, setDecision] = useState<'passed' | 'revision' | 'failed' | null>(null);
  const [rubricCorrectness, setRubricCorrectness] = useState<RubricRating | null>(null);
  const [rubricSecurity, setRubricSecurity] = useState<RubricRating | null>(null);
  const [rubricQuality, setRubricQuality] = useState<RubricRating | null>(null);
  const [rubricUnderstanding, setRubricUnderstanding] = useState<RubricRating | null>(null);
  const [feedback, setFeedback] = useState('');
  const [toolAdoptionVerified, setToolAdoptionVerified] = useState(false);
  const [toolAdoptionDetails, setToolAdoptionDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (attemptId) fetchAttemptData();
  }, [attemptId]);

  async function fetchAttemptData() {
    setLoading(true);
    setError(null);
    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('submission_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;
      const fetchedAttempt = attemptData as SubmissionAttempt;
      setAttempt(fetchedAttempt);

      // Fetch apprentice, layer, project in parallel
      const [apprenticeRes, layerRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', fetchedAttempt.apprentice_id).single(),
        supabase.from('layers').select('*').eq('id', fetchedAttempt.layer_id).single(),
      ]);

      if (apprenticeRes.data) setApprentice(apprenticeRes.data as Profile);
      if (layerRes.data) {
        const fetchedLayer = layerRes.data as Layer;
        setLayer(fetchedLayer);
        const { data: projData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', fetchedLayer.project_id)
          .single();
        if (projData) setProject(projData as Project);
      }
    } catch {
      setError('Failed to load submission details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id || !attempt || !decision) return;

    if (!feedback.trim()) {
      setSubmitError('Feedback is required.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const { error: reviewError } = await supabase.from('submission_reviews').insert({
        attempt_id: attempt.id,
        coach_id: profile.id,
        decision,
        rubric_correctness: rubricCorrectness,
        rubric_security: rubricSecurity,
        rubric_quality: rubricQuality,
        rubric_understanding: rubricUnderstanding,
        feedback: feedback.trim(),
        tool_adoption_verified: showToolAdoption ? toolAdoptionVerified : null,
        tool_adoption_details: showToolAdoption && toolAdoptionDetails.trim() ? toolAdoptionDetails.trim() : null,
      });

      if (reviewError) throw reviewError;
      navigate('/coach/dashboard');
    } catch {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const showToolAdoption = project ? project.sort_order >= 5 && project.sort_order <= 9 : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Unable to load submission"
        description={error || 'Submission not found.'}
        action={
          <Link to="/coach/dashboard" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Back to Dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link to="/coach/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Submission details */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Submission Details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Apprentice</p>
              <p className="text-sm text-slate-200">{apprentice?.full_name || 'Unknown'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Project / Layer</p>
            <p className="text-sm text-slate-200">
              {project && `P${project.sort_order}: ${project.title}`}
              {layer && ` / ${layer.name}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Attempt</p>
            <p className="text-sm text-slate-200">#{attempt.attempt_number}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Submitted</p>
            <p className="text-sm text-slate-200">{format(new Date(attempt.created_at), 'PPp')}</p>
          </div>
        </div>

        {attempt.github_url && (
          <div className="mt-4">
            <a
              href={attempt.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
            >
              <Github className="h-4 w-4" />
              {attempt.github_url}
            </a>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-1 text-xs text-slate-500">Notes</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3">
            {attempt.notes}
          </p>
        </div>

        {attempt.attachment_paths && attempt.attachment_paths.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs text-slate-500">Attachments</p>
            <div className="space-y-1">
              {attempt.attachment_paths.map((path, i) => (
                <p key={i} className="text-xs text-slate-400">{path}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <StatusBadge status={attempt.status} size="md" />
        </div>
      </div>

      {/* Review form */}
      <form onSubmit={handleSubmitReview} className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-200">Review Form</h2>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Rubric */}
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Rubric Assessment</h3>
            <div className="space-y-4">
              {[
                { label: 'Correctness', value: rubricCorrectness, setter: setRubricCorrectness },
                { label: 'Security', value: rubricSecurity, setter: setRubricSecurity },
                { label: 'Quality', value: rubricQuality, setter: setRubricQuality },
                { label: 'Understanding', value: rubricUnderstanding, setter: setRubricUnderstanding },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <p className="mb-2 text-sm text-slate-400">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {rubricOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setter(option.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          value === option.value
                            ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Decision <span className="text-danger-400">*</span></h3>
            <div className="flex flex-wrap gap-3">
              {decisionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDecision(option.value)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    decision === option.value
                      ? option.color
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label htmlFor="feedback" className="mb-1.5 block text-sm font-medium text-slate-300">
              Feedback <span className="text-danger-400">*</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Provide detailed feedback for the apprentice..."
              rows={5}
              required
            />
          </div>

          {/* Tool adoption (P5-P9) */}
          {showToolAdoption && (
            <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300">Tool Adoption (P5-P9)</h3>
              </div>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toolAdoptionVerified}
                  onChange={(e) => setToolAdoptionVerified(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-300">Tool adoption verified</span>
              </label>
              <textarea
                value={toolAdoptionDetails}
                onChange={(e) => setToolAdoptionDetails(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Details about tool adoption..."
                rows={2}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !decision || !feedback.trim()}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
