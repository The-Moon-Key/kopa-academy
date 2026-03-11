import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { EmptyState } from '../../components/EmptyState';
import type { Profile, Project, Layer } from '../../types';
import { Users, Loader2, ChevronRight, User } from 'lucide-react';

interface ApprenticeWithProgress extends Profile {
  currentProject?: Project;
  currentLayer?: Layer;
  progressPercent: number;
}

export function ApprenticeListPage() {
  const { profile } = useAppStore();
  const [apprentices, setApprentices] = useState<ApprenticeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) fetchApprentices();
  }, [profile?.id]);

  async function fetchApprentices() {
    setLoading(true);
    setError(null);
    try {
      const { data: apprenticeData } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_coach_id', profile!.id)
        .eq('role', 'apprentice')
        .order('full_name');

      const fetchedApprentices = (apprenticeData as Profile[]) || [];

      // Fetch projects and layers for context
      const [projectsRes, layersRes] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order'),
        supabase.from('layers').select('*').order('sort_order'),
      ]);

      const projects = (projectsRes.data as Project[]) || [];
      const layers = (layersRes.data as Layer[]) || [];
      const totalProjects = projects.length || 10;

      const enriched: ApprenticeWithProgress[] = fetchedApprentices.map((a) => {
        const currentProject = projects.find((p) => p.id === a.current_project_id);
        const currentLayer = layers.find((l) => l.id === a.current_layer_id);
        const currentSortOrder = currentProject?.sort_order ?? 0;
        const progressPercent = Math.round((currentSortOrder / totalProjects) * 100);
        return { ...a, currentProject, currentLayer, progressPercent };
      });

      setApprentices(enriched);
    } catch {
      setError('Failed to load apprentices.');
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
        icon={<Users className="h-12 w-12" />}
        title="Unable to load apprentices"
        description={error}
        action={
          <button onClick={fetchApprentices} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  if (apprentices.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No apprentices assigned"
        description="You don't have any apprentices assigned to you yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Apprentices</h1>
        <p className="mt-1 text-sm text-slate-500">{apprentices.length} apprentice{apprentices.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      <div className="space-y-2">
        {apprentices.map((apprentice) => (
          <Link
            key={apprentice.id}
            to={`/coach/apprentices/${apprentice.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                <User className="h-5 w-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-200">{apprentice.full_name}</h3>
                <p className="text-xs text-slate-500">
                  {apprentice.currentProject
                    ? `P${apprentice.currentProject.sort_order}: ${apprentice.currentProject.title}`
                    : 'Not started'}
                  {apprentice.currentLayer && ` / ${apprentice.currentLayer.name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:block w-32">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{apprentice.progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${apprentice.progressPercent}%` }}
                  />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
