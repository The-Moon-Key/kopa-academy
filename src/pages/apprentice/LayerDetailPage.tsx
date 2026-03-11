import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { Layer, SubmissionAttempt, SubmissionReview } from '../../types';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Github,
  FileText,
  Paperclip,
  MessageSquare,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export function LayerDetailPage() {
  const { projectId, layerId } = useParams<{ projectId: string; layerId: string }>();
  const { profile } = useAppStore();

  const [layer, setLayer] = useState<Layer | null>(null);
  const [attempts, setAttempts] = useState<SubmissionAttempt[]>([]);
  const [latestReview, setLatestReview] = useState<SubmissionReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission form state
  const [githubUrl, setGithubUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (layerId) fetchLayerData();
  }, [layerId, profile?.id]);

  async function fetchLayerData() {
    setLoading(true);
    setError(null);
    try {
      const { data: layerData, error: layerError } = await supabase
        .from('layers')
        .select('*')
        .eq('id', Number(layerId))
        .single();

      if (layerError) throw layerError;
      setLayer(layerData as Layer);

      if (profile?.id) {
        const { data: attemptsData } = await supabase
          .from('submission_attempts')
          .select('*')
          .eq('apprentice_id', profile.id)
          .eq('layer_id', Number(layerId))
          .order('attempt_number', { ascending: false });
        const fetchedAttempts = (attemptsData as SubmissionAttempt[]) || [];
        setAttempts(fetchedAttempts);

        // Fetch latest review across all attempts
        if (fetchedAttempts.length > 0) {
          const attemptIds = fetchedAttempts.map((a) => a.id);
          const { data: reviewsData } = await supabase
            .from('submission_reviews')
            .select('*')
            .in('attempt_id', attemptIds)
            .order('created_at', { ascending: false })
            .limit(1);
          if (reviewsData && reviewsData.length > 0) {
            setLatestReview(reviewsData[0] as SubmissionReview);
          }
        }
      }
    } catch {
      setError('Failed to load layer details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id || !layer) return;

    setSubmitError(null);
    setSubmitSuccess(false);

    if (layer.requires_github && !githubUrl.trim()) {
      setSubmitError('GitHub URL is required for this layer.');
      return;
    }

    if (!notes.trim()) {
      setSubmitError('Notes are required.');
      return;
    }

    setSubmitting(true);
    try {
      const nextAttemptNumber = attempts.length > 0 ? attempts[0].attempt_number + 1 : 1;

      const { error: insertError } = await supabase.from('submission_attempts').insert({
        apprentice_id: profile.id,
        layer_id: layer.id,
        attempt_number: nextAttemptNumber,
        github_url: githubUrl.trim() || null,
        notes: notes.trim(),
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      setGithubUrl('');
      setNotes('');
      fetchLayerData();
    } catch {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !layer) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Unable to load layer"
        description={error || 'Layer not found.'}
        action={
          <Link to={`/projects/${projectId}`} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Back to Project
          </Link>
        }
      />
    );
  }

  const currentAttempt = attempts[0];
  const canSubmit = !currentAttempt || currentAttempt.status !== 'pending';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Layer header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400">
            Layer {layer.sort_order}
          </span>
          {currentAttempt && <StatusBadge status={currentAttempt.status} />}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{layer.name}</h1>
      </div>

      {/* Layer description */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-200">Description</h2>
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{layer.description}</p>
      </div>

      {/* Latest review feedback */}
      {latestReview && (
        <div className={`rounded-xl border p-6 ${
          latestReview.decision === 'passed'
            ? 'border-success-500/30 bg-success-500/5'
            : latestReview.decision === 'revision'
            ? 'border-warning-500/30 bg-warning-500/5'
            : 'border-danger-500/30 bg-danger-500/5'
        }`}>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-200">Latest Review Feedback</h2>
            <StatusBadge status={latestReview.decision} />
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{latestReview.feedback}</p>
          <p className="mt-2 text-xs text-slate-500">
            {format(new Date(latestReview.created_at), 'PPp')}
          </p>
        </div>
      )}

      {/* Submission form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-200">
          {canSubmit ? 'Submit Your Work' : 'Awaiting Review'}
        </h2>

        {!canSubmit && (
          <div className="flex items-center gap-2 text-sm text-brand-400">
            <Clock className="h-4 w-4" />
            <span>Your current submission is pending review. You can submit again once reviewed.</span>
          </div>
        )}

        {canSubmit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-lg border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-400">
                Submission successful! Your work is now pending review.
              </div>
            )}

            {/* GitHub URL */}
            <div>
              <label htmlFor="githubUrl" className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                <Github className="h-4 w-4" />
                GitHub URL
                {layer.requires_github && <span className="text-danger-400">*</span>}
              </label>
              <input
                id="githubUrl"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="https://github.com/..."
                required={layer.requires_github}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                <FileText className="h-4 w-4" />
                Notes <span className="text-danger-400">*</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Describe your approach, challenges, and what you learned..."
                rows={4}
                required
              />
            </div>

            {/* File attachment placeholder */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                <Paperclip className="h-4 w-4" />
                Attachments
              </label>
              <div className="rounded-lg border-2 border-dashed border-slate-700 p-6 text-center">
                <Paperclip className="mx-auto mb-2 h-6 w-6 text-slate-600" />
                <p className="text-xs text-slate-500">File attachments will be available via Supabase Storage</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>

      {/* Previous attempts */}
      {attempts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Previous Attempts</h2>
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    Attempt #{attempt.attempt_number}
                  </span>
                  <StatusBadge status={attempt.status} />
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{attempt.notes}</p>
                {attempt.github_url && (
                  <a
                    href={attempt.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                  >
                    <Github className="h-3 w-3" />
                    {attempt.github_url}
                  </a>
                )}
                <p className="mt-2 text-xs text-slate-600">
                  {format(new Date(attempt.created_at), 'PPp')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
