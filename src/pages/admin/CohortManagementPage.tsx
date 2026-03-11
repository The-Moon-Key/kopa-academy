import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EmptyState } from '../../components/EmptyState';
import type { Cohort, Profile } from '../../types';
import { format } from 'date-fns';
import { Settings, Loader2, Plus, AlertCircle, Users } from 'lucide-react';

export function CohortManagementPage() {
  const [cohorts, setCohorts] = useState<(Cohort & { memberCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchCohorts();
  }, []);

  async function fetchCohorts() {
    setLoading(true);
    setError(null);
    try {
      const [cohortsRes, profilesRes] = await Promise.all([
        supabase.from('cohorts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, cohort_id'),
      ]);

      const fetchedCohorts = (cohortsRes.data as Cohort[]) || [];
      const profiles = (profilesRes.data as Pick<Profile, 'id' | 'cohort_id'>[]) || [];

      const withCounts = fetchedCohorts.map((cohort) => ({
        ...cohort,
        memberCount: profiles.filter((p) => p.cohort_id === cohort.id).length,
      }));

      setCohorts(withCounts);
    } catch {
      setError('Failed to load cohorts.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      const { error: insertError } = await supabase.from('cohorts').insert({
        name: newName.trim(),
        started_at: newStartDate || null,
      });

      if (insertError) throw insertError;

      setNewName('');
      setNewStartDate('');
      setShowForm(false);
      fetchCohorts();
    } catch {
      setCreateError('Failed to create cohort.');
    } finally {
      setCreating(false);
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
        icon={<Settings className="h-12 w-12" />}
        title="Unable to load cohorts"
        description={error}
        action={
          <button onClick={fetchCohorts} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Cohort Management</h1>
          <p className="mt-1 text-sm text-slate-500">{cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          New Cohort
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-200">Create New Cohort</h2>

          {createError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateCohort} className="space-y-4">
            <div>
              <label htmlFor="cohortName" className="mb-1.5 block text-sm font-medium text-slate-300">
                Cohort Name <span className="text-danger-400">*</span>
              </label>
              <input
                id="cohortName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g., Cohort 2026 Q1"
                required
              />
            </div>
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-slate-300">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? 'Creating...' : 'Create Cohort'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cohorts list */}
      {cohorts.length === 0 ? (
        <EmptyState
          icon={<Settings className="h-12 w-12" />}
          title="No cohorts"
          description="Create your first cohort to get started."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Create Cohort
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-base font-semibold text-slate-200">{cohort.name}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Start Date</span>
                  <span className="text-slate-300">
                    {cohort.started_at ? format(new Date(cohort.started_at), 'PP') : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Members</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Users className="h-3 w-3" />
                    {cohort.memberCount}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-300">{format(new Date(cohort.created_at), 'PP')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
