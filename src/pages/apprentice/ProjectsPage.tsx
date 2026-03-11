import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { EmptyState } from '../../components/EmptyState';
import type { Project } from '../../types';
import { FolderOpen, CheckCircle2, Lock, Play, Loader2 } from 'lucide-react';

export function ProjectsPage() {
  const { profile, projects, setProjects } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order');
      if (queryError) throw queryError;
      setProjects((data as Project[]) || []);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  function getProjectStatus(project: Project): 'locked' | 'current' | 'completed' {
    if (!profile?.current_project_id) return project.sort_order === 0 ? 'current' : 'locked';
    const currentSortOrder = projects.find((p) => p.id === profile.current_project_id)?.sort_order ?? 0;
    if (project.sort_order < currentSortOrder) return 'completed';
    if (project.sort_order === currentSortOrder) return 'current';
    return 'locked';
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
        icon={<FolderOpen className="h-12 w-12" />}
        title="Unable to load projects"
        description={error}
        action={
          <button onClick={fetchProjects} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="No projects available"
        description="Projects will appear here once they are configured."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Your 10-project learning journey</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => {
          const status = getProjectStatus(project);
          const isNavigable = status !== 'locked';

          return (
            <Link
              key={project.id}
              to={isNavigable ? `/projects/${project.id}` : '#'}
              className={`group relative flex flex-col rounded-xl border p-5 transition-all ${
                status === 'current'
                  ? 'border-brand-500/50 bg-brand-500/10 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10'
                  : status === 'completed'
                  ? 'border-success-500/30 bg-success-500/5 hover:border-success-400'
                  : 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                  status === 'current' ? 'bg-brand-500/20 text-brand-400' :
                  status === 'completed' ? 'bg-success-500/20 text-success-400' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  P{project.sort_order}
                </span>
                {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-success-400" />}
                {status === 'current' && <Play className="h-5 w-5 text-brand-400" />}
                {status === 'locked' && <Lock className="h-5 w-5 text-slate-600" />}
              </div>

              <h3 className="text-base font-semibold text-slate-200 leading-tight">{project.title}</h3>
              {project.subtitle && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{project.subtitle}</p>
              )}

              <div className="mt-auto pt-3">
                <span className={`text-xs font-medium capitalize ${
                  status === 'current' ? 'text-brand-400' :
                  status === 'completed' ? 'text-success-400' :
                  'text-slate-600'
                }`}>
                  {status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
