import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { TierBadge } from '../../components/TierBadge';
import { EmptyState } from '../../components/EmptyState';
import type { Project, CompetencyProgress, SkillDomain, Competency, Layer } from '../../types';
import {
  LayoutDashboard,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  Loader2,
} from 'lucide-react';

export function DashboardPage() {
  const { profile, projects, setProjects, domains, setDomains, competencies, setCompetencies, layers, setLayers } = useAppStore();
  const [competencyProgress, setCompetencyProgress] = useState<CompetencyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, domainsRes, competenciesRes, layersRes] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order'),
        supabase.from('skill_domains').select('*').order('sort_order'),
        supabase.from('competencies').select('*'),
        supabase.from('layers').select('*').order('sort_order'),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data as Project[]);
      if (domainsRes.data) setDomains(domainsRes.data as SkillDomain[]);
      if (competenciesRes.data) setCompetencies(competenciesRes.data as Competency[]);
      if (layersRes.data) setLayers(layersRes.data as Layer[]);

      if (profile?.id) {
        const { data: progressData } = await supabase
          .from('competency_progress')
          .select('*')
          .eq('apprentice_id', profile.id);
        if (progressData) setCompetencyProgress(progressData as CompetencyProgress[]);
      }
    } catch {
      setError('Failed to load dashboard data. Please try again.');
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
        icon={<LayoutDashboard className="h-12 w-12" />}
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

  const currentProject = projects.find((p) => p.id === profile?.current_project_id);
  const currentProjectLayers = layers.filter((l) => l.project_id === profile?.current_project_id);
  const currentLayerIndex = currentProjectLayers.findIndex((l) => l.id === profile?.current_layer_id);
  const layerProgress = currentProjectLayers.length > 0
    ? Math.round((currentLayerIndex / currentProjectLayers.length) * 100)
    : 0;

  // Group competencies by domain for summary
  const domainSummary = domains.map((domain) => {
    const domainCompetencies = competencies.filter((c) => c.domain_id === domain.id);
    const progressEntries = domainCompetencies.map((c) => {
      const p = competencyProgress.find((cp) => cp.competency_id === c.id);
      return p ? p.effective_tier : 0;
    });
    const avgTier = progressEntries.length > 0
      ? Math.round(progressEntries.reduce((a, b) => a + b, 0) / progressEntries.length)
      : 0;
    return { domain, avgTier, count: domainCompetencies.length };
  });

  function getProjectStatus(project: Project): 'locked' | 'current' | 'completed' {
    if (!profile?.current_project_id) return project.sort_order === 0 ? 'current' : 'locked';
    const currentSortOrder = projects.find((p) => p.id === profile.current_project_id)?.sort_order ?? 0;
    if (project.sort_order < currentSortOrder) return 'completed';
    if (project.sort_order === currentSortOrder) return 'current';
    return 'locked';
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {profile?.full_name || 'Apprentice'}</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {currentProject && (
          <Link
            to={`/projects/${currentProject.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Play className="h-4 w-4" />
            Continue Learning
          </Link>
        )}
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          <Trophy className="h-4 w-4" />
          View Portfolio
        </Link>
      </div>

      {/* Current project + layer progress */}
      {currentProject && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-1 text-sm font-medium text-slate-400">Current Project</h2>
          <h3 className="text-lg font-semibold text-slate-100">{currentProject.title}</h3>
          {currentProject.subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{currentProject.subtitle}</p>
          )}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>Layer Progress</span>
              <span>{layerProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all"
                style={{ width: `${layerProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Layer {currentLayerIndex + 1} of {currentProjectLayers.length}
            </p>
          </div>
        </div>
      )}

      {/* Competency summary */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Competency Summary</h2>
        {domainSummary.length === 0 ? (
          <EmptyState title="No competency data" description="Competency progress will appear as you complete projects." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {domainSummary.map(({ domain, avgTier, count }) => (
              <div key={domain.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-slate-300 leading-tight">{domain.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{count} competencies</span>
                  <TierBadge tier={avgTier} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Journey map */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Journey Map</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {projects.map((project) => {
            const status = getProjectStatus(project);
            return (
              <Link
                key={project.id}
                to={status !== 'locked' ? `/projects/${project.id}` : '#'}
                className={`group relative rounded-xl border p-4 transition-all ${
                  status === 'current'
                    ? 'border-brand-500/50 bg-brand-500/10 hover:border-brand-400'
                    : status === 'completed'
                    ? 'border-success-500/30 bg-success-500/5 hover:border-success-400'
                    : 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">P{project.sort_order}</span>
                  {status === 'completed' && <CheckCircle2 className="h-4 w-4 text-success-400" />}
                  {status === 'current' && <Play className="h-4 w-4 text-brand-400" />}
                  {status === 'locked' && <Lock className="h-4 w-4 text-slate-600" />}
                </div>
                <h3 className="text-sm font-semibold text-slate-200 leading-tight">{project.title}</h3>
                {project.subtitle && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{project.subtitle}</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Recent Activity</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3 text-slate-500">
            <ArrowRight className="h-5 w-5" />
            <p className="text-sm">Activity feed will appear here as you make progress through your projects.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
