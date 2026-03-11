import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { SubmissionAttempt, Profile, Layer, Project } from '../../types';
import { format } from 'date-fns';
import { ClipboardCheck, Loader2, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface PendingReview extends SubmissionAttempt {
  apprentice?: Profile;
  layer?: Layer;
  project?: Project;
}

export function CoachDashboardPage() {
  const { profile } = useAppStore();
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [reviewedTodayCount, setReviewedTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile?.id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Get assigned apprentices
      const { data: apprentices } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_coach_id', profile!.id);

      const assignedApprentices = (apprentices as Profile[]) || [];
      const apprenticeIds = assignedApprentices.map((a) => a.id);

      if (apprenticeIds.length === 0) {
        setPendingReviews([]);
        setLoading(false);
        return;
      }

      // Get pending submission attempts
      const { data: pendingData } = await supabase
        .from('submission_attempts')
        .select('*')
        .in('apprentice_id', apprenticeIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      // Get layers and projects for context
      const [layersRes, projectsRes] = await Promise.all([
        supabase.from('layers').select('*'),
        supabase.from('projects').select('*'),
      ]);

      const layers = (layersRes.data as Layer[]) || [];
      const projects = (projectsRes.data as Project[]) || [];

      const enriched: PendingReview[] = ((pendingData as SubmissionAttempt[]) || []).map((attempt) => {
        const apprentice = assignedApprentices.find((a) => a.id === attempt.apprentice_id);
        const layer = layers.find((l) => l.id === attempt.layer_id);
        const project = layer ? projects.find((p) => p.id === layer.project_id) : undefined;
        return { ...attempt, apprentice, layer, project };
      });

      setPendingReviews(enriched);

      // Count reviews done today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('submission_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', profile!.id)
        .gte('created_at', today.toISOString());
      setReviewedTodayCount(count || 0);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-12 w-12" />}
        title="Unable to load dashboard"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Coach Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Review queue and apprentice progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-warning-400">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Pending Reviews</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-100">{pendingReviews.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-success-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Reviewed Today</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-100">{reviewedTodayCount}</p>
        </div>
      </div>

      {/* Pending review queue */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Pending Review Queue</h2>
        {pendingReviews.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-10 w-10 text-success-400" />}
            title="All caught up!"
            description="No pending reviews at the moment."
          />
        ) : (
          <div className="space-y-2">
            {pendingReviews.map((review) => (
              <Link
                key={review.id}
                to={`/coach/review/${review.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">
                      {review.apprentice?.full_name || 'Unknown Apprentice'}
                    </span>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-xs text-slate-500">
                    {review.project && `P${review.project.sort_order}: ${review.project.title}`}
                    {review.layer && ` / ${review.layer.name}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Submitted {format(new Date(review.created_at), 'PPp')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
