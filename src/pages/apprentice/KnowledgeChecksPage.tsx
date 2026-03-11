import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { KnowledgeCheckQuestion, KnowledgeCheckSession, Layer, Project } from '../../types';
import { BookCheck, ChevronRight, Loader2 } from 'lucide-react';

interface QuestionWithContext extends KnowledgeCheckQuestion {
  layer?: Layer;
  project?: Project;
  currentResult: 'pass' | 'developing' | 'not_yet' | 'not_attempted';
}

export function KnowledgeChecksPage() {
  const { profile, projects, setProjects, setLayers } = useAppStore();
  const [questions, setQuestions] = useState<QuestionWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, layersRes, projectsRes] = await Promise.all([
        supabase.from('knowledge_check_questions').select('*'),
        supabase.from('layers').select('*').order('sort_order'),
        supabase.from('projects').select('*').order('sort_order'),
      ]);

      const fetchedLayers = (layersRes.data as Layer[]) || [];
      const fetchedProjects = (projectsRes.data as Project[]) || [];
      setLayers(fetchedLayers);
      setProjects(fetchedProjects);

      const fetchedQuestions = (questionsRes.data as KnowledgeCheckQuestion[]) || [];

      // Fetch current sessions for all questions
      let sessions: KnowledgeCheckSession[] = [];
      if (profile?.id && fetchedQuestions.length > 0) {
        const { data: sessionsData } = await supabase
          .from('knowledge_check_sessions')
          .select('*')
          .eq('apprentice_id', profile.id)
          .eq('is_current', true);
        sessions = (sessionsData as KnowledgeCheckSession[]) || [];
      }

      const enriched: QuestionWithContext[] = fetchedQuestions.map((q) => {
        const layer = fetchedLayers.find((l) => l.id === q.layer_id);
        const project = layer ? fetchedProjects.find((p) => p.id === layer.project_id) : undefined;
        const session = sessions.find((s) => s.question_id === q.id);
        const currentResult = session?.result || 'not_attempted';
        return { ...q, layer, project, currentResult: currentResult as QuestionWithContext['currentResult'] };
      });

      // Sort by project sort_order then layer sort_order
      enriched.sort((a, b) => {
        const projA = a.project?.sort_order ?? 999;
        const projB = b.project?.sort_order ?? 999;
        if (projA !== projB) return projA - projB;
        const layerA = a.layer?.sort_order ?? 999;
        const layerB = b.layer?.sort_order ?? 999;
        return layerA - layerB;
      });

      setQuestions(enriched);
    } catch {
      setError('Failed to load knowledge checks.');
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
        icon={<BookCheck className="h-12 w-12" />}
        title="Unable to load knowledge checks"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<BookCheck className="h-12 w-12" />}
        title="No knowledge checks available"
        description="Knowledge check questions will appear here as projects are configured."
      />
    );
  }

  // Group by project
  const grouped = questions.reduce<Record<string, QuestionWithContext[]>>((acc, q) => {
    const key = q.project ? `P${q.project.sort_order}: ${q.project.title}` : 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Knowledge Checks</h1>
        <p className="mt-1 text-sm text-slate-500">
          {questions.length} questions across {projects.length} projects
        </p>
      </div>

      {Object.entries(grouped).map(([group, groupQuestions]) => (
        <div key={group}>
          <h2 className="mb-3 text-base font-semibold text-slate-300">{group}</h2>
          <div className="space-y-2">
            {groupQuestions.map((q) => (
              <Link
                key={q.id}
                to={`/knowledge-checks/${q.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-slate-200 line-clamp-2">{q.question_text}</p>
                  {q.layer && (
                    <p className="mt-1 text-xs text-slate-500">
                      Layer: {q.layer.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={q.currentResult} />
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
