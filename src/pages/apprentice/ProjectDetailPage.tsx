import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { Project, Layer, ApprenticeProjectBrief, SubmissionAttempt, LayerStatus } from '../../types';
import { FolderOpen, ArrowLeft, ChevronRight, Loader2, FileText } from 'lucide-react';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAppStore();
  const [project, setProject] = useState<Project | null>(null);
  const [layers, setLocalLayers] = useState<Layer[]>([]);
  const [personalisedBrief, setPersonalisedBrief] = useState<ApprenticeProjectBrief | null>(null);
  const [attempts, setAttempts] = useState<SubmissionAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = Number(id);

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id, profile?.id]);

  async function fetchProjectData() {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, layersRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('layers').select('*').eq('project_id', projectId).order('sort_order'),
      ]);

      if (projectRes.error) throw projectRes.error;
      setProject(projectRes.data as Project);
      setLocalLayers((layersRes.data as Layer[]) || []);

      // Fetch personalised brief for P8-P9
      const proj = projectRes.data as Project;
      if (profile?.id && (proj.sort_order === 8 || proj.sort_order === 9)) {
        const { data: briefData } = await supabase
          .from('apprentice_project_briefs')
          .select('*')
          .eq('apprentice_id', profile.id)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (briefData && briefData.length > 0) {
          setPersonalisedBrief(briefData[0] as ApprenticeProjectBrief);
        }
      }

      // Fetch submission attempts to derive layer statuses
      if (profile?.id) {
        const layerIds = (layersRes.data as Layer[])?.map((l) => l.id) || [];
        if (layerIds.length > 0) {
          const { data: attemptsData } = await supabase
            .from('submission_attempts')
            .select('*')
            .eq('apprentice_id', profile.id)
            .in('layer_id', layerIds)
            .order('attempt_number', { ascending: false });
          setAttempts((attemptsData as SubmissionAttempt[]) || []);
        }
      }
    } catch {
      setError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }

  function getLayerStatus(layer: Layer): LayerStatus {
    if (!profile?.current_layer_id || !profile?.current_project_id) {
      // If no current tracking, first layer of first project is current
      if (layers.length > 0 && layer.id === layers[0].id) return 'current';
      return 'locked';
    }

    const layerAttempts = attempts.filter((a) => a.layer_id === layer.id);
    const latestAttempt = layerAttempts[0]; // sorted desc by attempt_number

    if (latestAttempt) {
      switch (latestAttempt.status) {
        case 'passed': return 'completed';
        case 'pending': return 'pending';
        case 'revision': return 'revision_needed';
        case 'failed': return 'failed';
      }
    }

    if (layer.id === profile.current_layer_id && layer.project_id === profile.current_project_id) {
      return 'current';
    }

    // Check if this layer comes before the current layer
    const currentLayerIndex = layers.findIndex((l) => l.id === profile.current_layer_id);
    const thisLayerIndex = layers.findIndex((l) => l.id === layer.id);

    if (thisLayerIndex < currentLayerIndex) return 'completed';
    if (thisLayerIndex > currentLayerIndex) return 'locked';

    return 'locked';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="Unable to load project"
        description={error || 'Project not found.'}
        action={
          <Link to="/projects" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Back to Projects
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-400">
            P{project.sort_order}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{project.title}</h1>
        {project.subtitle && (
          <p className="mt-1 text-sm text-slate-400">{project.subtitle}</p>
        )}
      </div>

      {/* Brief */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-brand-400" />
          <h2 className="text-base font-semibold text-slate-200">
            {personalisedBrief ? 'Your Personalised Brief' : 'Project Brief'}
          </h2>
        </div>
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {personalisedBrief ? personalisedBrief.brief_text : project.brief}
        </p>
      </div>

      {/* Layers list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Layers</h2>
        {layers.length === 0 ? (
          <EmptyState title="No layers" description="Layers for this project have not been configured yet." />
        ) : (
          <div className="space-y-2">
            {layers.map((layer) => {
              const status = getLayerStatus(layer);
              const isNavigable = status !== 'locked';

              return (
                <Link
                  key={layer.id}
                  to={isNavigable ? `/projects/${project.id}/layers/${layer.id}` : '#'}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                    isNavigable
                      ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/80'
                      : 'border-slate-800/50 bg-slate-900/30 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                      L{layer.sort_order}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-slate-200">{layer.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{layer.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    {isNavigable && <ChevronRight className="h-4 w-4 text-slate-600" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
