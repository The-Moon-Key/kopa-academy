import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { EmptyState } from '../../components/EmptyState';
import type { AIPromptVersion } from '../../types';
import { format } from 'date-fns';
import { BrainCircuit, Loader2, Plus, AlertCircle, Check, X } from 'lucide-react';

type Persona = 'assistant' | 'evaluator';

export function AIPromptsPage() {
  const { profile } = useAppStore();
  const [prompts, setPrompts] = useState<AIPromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPromptVersion | null>(null);

  // Form state
  const [formPersona, setFormPersona] = useState<Persona>('assistant');
  const [formPromptText, setFormPromptText] = useState('');
  const [formModelVersion, setFormModelVersion] = useState('');
  const [formIsActive, setFormIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('ai_prompt_versions')
        .select('*')
        .order('persona')
        .order('version', { ascending: false });

      if (fetchErr) throw fetchErr;
      setPrompts((data as AIPromptVersion[]) || []);
    } catch {
      setError('Failed to load AI prompt versions.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingPrompt(null);
    setFormPersona('assistant');
    setFormPromptText('');
    setFormModelVersion('');
    setFormIsActive(false);
    setSaveError(null);
    setShowForm(true);
  }

  function openEditForm(prompt: AIPromptVersion) {
    setEditingPrompt(prompt);
    setFormPersona(prompt.persona);
    setFormPromptText(prompt.prompt_text);
    setFormModelVersion(prompt.model_version);
    setFormIsActive(prompt.is_active);
    setSaveError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formPromptText.trim() || !formModelVersion.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editingPrompt) {
        const { error: updateErr } = await supabase
          .from('ai_prompt_versions')
          .update({
            prompt_text: formPromptText.trim(),
            model_version: formModelVersion.trim(),
            is_active: formIsActive,
          })
          .eq('id', editingPrompt.id);

        if (updateErr) throw updateErr;

        setPrompts((prev) =>
          prev.map((p) =>
            p.id === editingPrompt.id
              ? { ...p, prompt_text: formPromptText.trim(), model_version: formModelVersion.trim(), is_active: formIsActive }
              : p
          )
        );
      } else {
        // Calculate next version number for this persona
        const personaPrompts = prompts.filter((p) => p.persona === formPersona);
        const nextVersion = personaPrompts.length > 0 ? Math.max(...personaPrompts.map((p) => p.version)) + 1 : 1;

        const { data, error: insertErr } = await supabase
          .from('ai_prompt_versions')
          .insert({
            persona: formPersona,
            prompt_text: formPromptText.trim(),
            model_version: formModelVersion.trim(),
            version: nextVersion,
            is_active: formIsActive,
            created_by: profile?.id || null,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        setPrompts((prev) => [data as AIPromptVersion, ...prev]);
      }

      setShowForm(false);
      setEditingPrompt(null);
    } catch {
      setSaveError('Failed to save prompt version.');
    } finally {
      setSaving(false);
    }
  }

  const assistantPrompts = prompts.filter((p) => p.persona === 'assistant');
  const evaluatorPrompts = prompts.filter((p) => p.persona === 'evaluator');

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
        icon={<BrainCircuit className="h-12 w-12" />}
        title="Unable to load prompts"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  function renderPromptCard(prompt: AIPromptVersion) {
    return (
      <div
        key={prompt.id}
        className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">v{prompt.version}</span>
            <span className="text-xs text-slate-500">{prompt.model_version}</span>
          </div>
          <div className="flex items-center gap-2">
            {prompt.is_active ? (
              <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/20 px-2 py-0.5 text-xs font-medium text-success-400">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-600/30 bg-slate-700/40 px-2 py-0.5 text-xs font-medium text-slate-500">
                Inactive
              </span>
            )}
            <button
              onClick={() => openEditForm(prompt)}
              className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              Edit
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-3">{prompt.prompt_text}</p>
        <p className="text-xs text-slate-600">
          Created {format(new Date(prompt.created_at), 'PP')}
        </p>
      </div>
    );
  }

  function renderPersonaGroup(title: string, items: AIPromptVersion[]) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No prompt versions for this persona.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map(renderPromptCard)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Prompts</h1>
          <p className="mt-1 text-sm text-slate-500">{prompts.length} prompt versions</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          New Version
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">
            {editingPrompt ? `Edit Prompt v${editingPrompt.version}` : 'Create New Prompt Version'}
          </h2>

          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Persona</label>
              <select
                value={formPersona}
                onChange={(e) => setFormPersona(e.target.value as Persona)}
                disabled={!!editingPrompt}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              >
                <option value="assistant">Assistant</option>
                <option value="evaluator">Evaluator</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Model Version</label>
              <input
                type="text"
                value={formModelVersion}
                onChange={(e) => setFormModelVersion(e.target.value)}
                placeholder="e.g. gpt-4o-2024-05"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Active</label>
              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`mt-0.5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  formIsActive
                    ? 'border-success-500/30 bg-success-500/20 text-success-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {formIsActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {formIsActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Prompt Text</label>
            <textarea
              value={formPromptText}
              onChange={(e) => setFormPromptText(e.target.value)}
              rows={8}
              placeholder="Enter the prompt text..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formPromptText.trim() || !formModelVersion.trim()}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingPrompt ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingPrompt(null);
                setSaveError(null);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {renderPersonaGroup('Assistant Prompts', assistantPrompts)}
      {renderPersonaGroup('Evaluator Prompts', evaluatorPrompts)}
    </div>
  );
}
