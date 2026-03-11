import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import type { Profile, KnowledgeCheckQuestion, KnowledgeCheckSession } from '../../types';
import { format } from 'date-fns';
import { ShieldCheck, Loader2, AlertCircle, Search, CheckCircle2 } from 'lucide-react';

type KCResult = 'pass' | 'developing' | 'not_yet';

export function KCOverridePage() {
  const { profile } = useAppStore();
  const [apprentices, setApprentices] = useState<Profile[]>([]);
  const [questions, setQuestions] = useState<KnowledgeCheckQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApprentice, setSelectedApprentice] = useState<Profile | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  // Current KC result
  const [currentSession, setCurrentSession] = useState<KnowledgeCheckSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Override form
  const [newResult, setNewResult] = useState<KCResult>('pass');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedApprentice && selectedQuestionId) {
      fetchCurrentSession();
    } else {
      setCurrentSession(null);
    }
  }, [selectedApprentice, selectedQuestionId]);

  async function fetchInitialData() {
    setLoading(true);
    setError(null);
    try {
      const [profilesRes, questionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'apprentice').order('full_name'),
        supabase.from('knowledge_check_questions').select('*').order('layer_id').order('id'),
      ]);

      setApprentices((profilesRes.data as Profile[]) || []);
      setQuestions((questionsRes.data as KnowledgeCheckQuestion[]) || []);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCurrentSession() {
    if (!selectedApprentice || !selectedQuestionId) return;
    setLoadingSession(true);
    setCurrentSession(null);
    try {
      const { data } = await supabase
        .from('knowledge_check_sessions')
        .select('*')
        .eq('apprentice_id', selectedApprentice.id)
        .eq('question_id', selectedQuestionId)
        .eq('is_current', true)
        .maybeSingle();

      setCurrentSession((data as KnowledgeCheckSession) || null);
    } catch {
      // Silently fail - no current session
    } finally {
      setLoadingSession(false);
    }
  }

  async function handleOverride() {
    if (!selectedApprentice || !selectedQuestionId || !reason.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      // If there's a current session, mark it as not current
      if (currentSession) {
        await supabase
          .from('knowledge_check_sessions')
          .update({ is_current: false })
          .eq('id', currentSession.id);
      }

      // Determine next attempt number
      const attemptNumber = currentSession ? currentSession.attempt_number + 1 : 1;

      const { error: insertErr } = await supabase
        .from('knowledge_check_sessions')
        .insert({
          apprentice_id: selectedApprentice.id,
          question_id: selectedQuestionId,
          attempt_number: attemptNumber,
          is_current: true,
          result: newResult,
          result_source: 'manual_admin',
          override_reason: reason.trim(),
          overridden_by: profile?.id || null,
          completed_at: new Date().toISOString(),
        });

      if (insertErr) throw insertErr;

      setSubmitSuccess(true);
      setReason('');
      // Refresh the current session
      fetchCurrentSession();
    } catch {
      setSubmitError('Failed to create override.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredApprentices = apprentices.filter((a) =>
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        icon={<ShieldCheck className="h-12 w-12" />}
        title="Unable to load data"
        description={error}
        action={
          <button onClick={fetchInitialData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">KC Override</h1>
        <p className="mt-1 text-sm text-slate-500">Manually override knowledge check results</p>
      </div>

      {/* Step 1: Search for apprentice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">1. Select Apprentice</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedApprentice(null);
              setSelectedQuestionId(null);
              setSubmitSuccess(false);
            }}
            placeholder="Search apprentices by name..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {searchTerm && !selectedApprentice && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800">
            {filteredApprentices.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No apprentices found.</p>
            ) : (
              filteredApprentices.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedApprentice(a);
                    setSearchTerm(a.full_name);
                    setSubmitSuccess(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {a.full_name}
                </button>
              ))
            )}
          </div>
        )}

        {selectedApprentice && (
          <p className="text-xs text-slate-400">
            Selected: <span className="font-medium text-slate-200">{selectedApprentice.full_name}</span>
          </p>
        )}
      </div>

      {/* Step 2: Select question */}
      {selectedApprentice && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">2. Select Question</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500">No knowledge check questions available.</p>
          ) : (
            <select
              value={selectedQuestionId ?? ''}
              onChange={(e) => {
                setSelectedQuestionId(e.target.value ? Number(e.target.value) : null);
                setSubmitSuccess(false);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select a question...</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  [Layer {q.layer_id}] {q.question_text.length > 80 ? q.question_text.slice(0, 80) + '...' : q.question_text}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 3: Current result and override form */}
      {selectedApprentice && selectedQuestionId && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">3. Current Result</h2>

          {loadingSession ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading current result...
            </div>
          ) : currentSession ? (
            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-slate-300">Attempt #{currentSession.attempt_number}</span>
                  {currentSession.result && (
                    <StatusBadge status={currentSession.result === 'pass' ? 'passed' : currentSession.result} />
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Source: {currentSession.result_source} | Completed: {currentSession.completed_at ? format(new Date(currentSession.completed_at), 'PP p') : 'In progress'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No existing KC result for this apprentice and question.</p>
          )}

          <hr className="border-slate-800" />

          <h2 className="text-sm font-semibold text-slate-200">4. Override</h2>

          {submitSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Override applied successfully.</span>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">New Result</label>
              <select
                value={newResult}
                onChange={(e) => setNewResult(e.target.value as KCResult)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="pass">Pass</option>
                <option value="developing">Developing</option>
                <option value="not_yet">Not Yet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Reason <span className="text-danger-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this override is necessary..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleOverride}
            disabled={submitting || !reason.trim()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Applying Override...' : 'Confirm Override'}
          </button>
        </div>
      )}
    </div>
  );
}
