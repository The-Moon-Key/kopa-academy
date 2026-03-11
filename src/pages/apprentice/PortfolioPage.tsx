import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { TierBadge } from '../../components/TierBadge';
import { EmptyState } from '../../components/EmptyState';
import type { CompetencyProgress, ProjectGithubLink, KnowledgeCheckSession } from '../../types';
import { Trophy, Github, Loader2, ExternalLink } from 'lucide-react';

export function PortfolioPage() {
  const { profile, domains, setDomains, competencies, setCompetencies, projects, setProjects } = useAppStore();
  const [progress, setProgress] = useState<CompetencyProgress[]>([]);
  const [githubLinks, setGithubLinks] = useState<ProjectGithubLink[]>([]);
  const [kcSessions, setKcSessions] = useState<KnowledgeCheckSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [domainsRes, competenciesRes, projectsRes] = await Promise.all([
        supabase.from('skill_domains').select('*').order('sort_order'),
        supabase.from('competencies').select('*'),
        supabase.from('projects').select('*').order('sort_order'),
      ]);

      if (domainsRes.data) setDomains(domainsRes.data);
      if (competenciesRes.data) setCompetencies(competenciesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);

      if (profile?.id) {
        const [progressRes, linksRes, kcRes] = await Promise.all([
          supabase.from('competency_progress').select('*').eq('apprentice_id', profile.id),
          supabase.from('project_github_links').select('*').eq('apprentice_id', profile.id),
          supabase.from('knowledge_check_sessions').select('*').eq('apprentice_id', profile.id).eq('is_current', true),
        ]);
        setProgress((progressRes.data as CompetencyProgress[]) || []);
        setGithubLinks((linksRes.data as ProjectGithubLink[]) || []);
        setKcSessions((kcRes.data as KnowledgeCheckSession[]) || []);
      }
    } catch {
      setError('Failed to load portfolio data.');
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
        icon={<Trophy className="h-12 w-12" />}
        title="Unable to load portfolio"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  // Compute KC pass rate per domain
  // We need to know which questions belong to which competency/domain
  // For simplicity, we group KC sessions by result
  const totalKcQuestions = kcSessions.length;
  const kcPassed = kcSessions.filter((s) => s.result === 'pass').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Portfolio</h1>
        <p className="mt-1 text-sm text-slate-500">
          {competencies.length} competencies across {domains.length} domains
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Competencies Tracked</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{progress.length} / {competencies.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">KC Pass Rate</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {totalKcQuestions > 0 ? Math.round((kcPassed / totalKcQuestions) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-600">{kcPassed} of {totalKcQuestions} questions</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">GitHub Links</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{githubLinks.length}</p>
        </div>
      </div>

      {/* Competencies by domain */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Competencies by Domain</h2>
        {domains.length === 0 ? (
          <EmptyState title="No domains configured" description="Skill domains and competencies will appear once configured." />
        ) : (
          <div className="space-y-6">
            {domains.map((domain) => {
              const domainCompetencies = competencies.filter((c) => c.domain_id === domain.id);

              return (
                <div key={domain.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-800 bg-slate-850 px-5 py-3">
                    <h3 className="text-sm font-semibold text-slate-200">{domain.name}</h3>
                    <span className="text-xs text-slate-500">{domainCompetencies.length} competencies</span>
                  </div>

                  {domainCompetencies.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">No competencies in this domain yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {domainCompetencies.map((comp) => {
                        const p = progress.find((cp) => cp.competency_id === comp.id);
                        return (
                          <div key={comp.id} className="flex items-center justify-between px-5 py-3">
                            <span className="text-sm text-slate-300">{comp.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase text-slate-600 w-6 text-right">P</span>
                                <TierBadge tier={p?.practical_tier ?? 0} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase text-slate-600 w-6 text-right">K</span>
                                <TierBadge tier={p?.knowledge_tier ?? 0} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase text-slate-600 w-6 text-right">E</span>
                                <TierBadge tier={p?.effective_tier ?? 0} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GitHub links by project */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">GitHub Links</h2>
        {githubLinks.length === 0 ? (
          <EmptyState
            icon={<Github className="h-10 w-10" />}
            title="No GitHub links yet"
            description="GitHub links will appear here as you submit work for projects."
          />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const projectLinks = githubLinks.filter((l) => l.project_id === project.id);
              if (projectLinks.length === 0) return null;
              return (
                <div key={project.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <h3 className="mb-2 text-sm font-medium text-slate-300">
                    P{project.sort_order}: {project.title}
                  </h3>
                  <div className="space-y-1">
                    {projectLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {link.label || link.github_url}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
