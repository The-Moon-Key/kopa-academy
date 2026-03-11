import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type { KnowledgeCheckQuestion, KnowledgeCheckSession, KnowledgeCheckMessage } from '../../types';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  BookCheck,
  Loader2,
  AlertTriangle,
  User,
  Bot,
  History,
  ChevronDown,
} from 'lucide-react';

export function KnowledgeCheckSessionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const { profile } = useAppStore();

  const [question, setQuestion] = useState<KnowledgeCheckQuestion | null>(null);
  const [sessions, setSessions] = useState<KnowledgeCheckSession[]>([]);
  const [currentSession, setCurrentSession] = useState<KnowledgeCheckSession | null>(null);
  const [messages, setMessages] = useState<KnowledgeCheckMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showRetakeWarning, setShowRetakeWarning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (questionId) fetchData();
  }, [questionId, profile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const { data: questionData, error: qError } = await supabase
        .from('knowledge_check_questions')
        .select('*')
        .eq('id', Number(questionId))
        .single();

      if (qError) throw qError;
      setQuestion(questionData as KnowledgeCheckQuestion);

      if (profile?.id) {
        const { data: sessionsData } = await supabase
          .from('knowledge_check_sessions')
          .select('*')
          .eq('apprentice_id', profile.id)
          .eq('question_id', Number(questionId))
          .order('attempt_number', { ascending: false });

        const fetchedSessions = (sessionsData as KnowledgeCheckSession[]) || [];
        setSessions(fetchedSessions);

        const current = fetchedSessions.find((s) => s.is_current) || fetchedSessions[0] || null;
        setCurrentSession(current);

        if (current) {
          const { data: messagesData } = await supabase
            .from('knowledge_check_messages')
            .select('*')
            .eq('session_id', current.id)
            .order('sequence');
          setMessages((messagesData as KnowledgeCheckMessage[]) || []);
        }
      }
    } catch {
      setError('Failed to load knowledge check.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSessionMessages(session: KnowledgeCheckSession) {
    setCurrentSession(session);
    try {
      const { data: messagesData } = await supabase
        .from('knowledge_check_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('sequence');
      setMessages((messagesData as KnowledgeCheckMessage[]) || []);
    } catch {
      setMessages([]);
    }
    setShowHistory(false);
  }

  function handleRetakeCheck() {
    const currentResult = sessions.find((s) => s.is_current)?.result;
    if (currentResult === 'pass') {
      setShowRetakeWarning(true);
    } else {
      startNewAttempt();
    }
  }

  async function startNewAttempt() {
    if (!profile?.id || !question) return;
    setShowRetakeWarning(false);

    try {
      const nextAttempt = sessions.length > 0 ? sessions[0].attempt_number + 1 : 1;

      const { data: newSession, error: insertError } = await supabase
        .from('knowledge_check_sessions')
        .insert({
          apprentice_id: profile.id,
          question_id: question.id,
          attempt_number: nextAttempt,
          is_current: true,
          result_source: 'ai',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setCurrentSession(newSession as KnowledgeCheckSession);
      setMessages([]);
      fetchData();
    } catch {
      setError('Failed to start new attempt.');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentSession || sending) return;

    setSending(true);
    const messageText = input.trim();
    setInput('');

    try {
      const nextSequence = messages.length + 1;
      const { data: newMsg, error: msgError } = await supabase
        .from('knowledge_check_messages')
        .insert({
          session_id: currentSession.id,
          role: 'user',
          content: messageText,
          sequence: nextSequence,
        })
        .select()
        .single();

      if (msgError) throw msgError;
      setMessages((prev) => [...prev, newMsg as KnowledgeCheckMessage]);

      // In a real app, this would trigger an Edge Function for AI evaluation
      // For now, we just show the user message
    } catch {
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <EmptyState
        icon={<BookCheck className="h-12 w-12" />}
        title="Unable to load knowledge check"
        description={error || 'Question not found.'}
        action={
          <Link to="/knowledge-checks" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Back to Knowledge Checks
          </Link>
        }
      />
    );
  }

  const sessionComplete = currentSession?.result !== null && currentSession?.result !== undefined;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800 pb-4">
        <Link to="/knowledge-checks" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400">
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Checks
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-100 leading-tight">{question.question_text}</h1>
            {currentSession && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">Attempt #{currentSession.attempt_number}</span>
                {currentSession.result && <StatusBadge status={currentSession.result} />}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* History dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
              >
                <History className="h-3.5 w-3.5" />
                History
                <ChevronDown className="h-3 w-3" />
              </button>
              {showHistory && sessions.length > 0 && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSessionMessages(session)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-slate-700 ${
                        session.id === currentSession?.id ? 'text-brand-400' : 'text-slate-300'
                      }`}
                    >
                      <span>Attempt #{session.attempt_number}</span>
                      <span className="text-slate-500">
                        {session.result ? session.result : 'in progress'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Retake button */}
            <button
              onClick={handleRetakeCheck}
              className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
            >
              {sessions.length === 0 ? 'Start' : 'Retake'}
            </button>
          </div>
        </div>
      </div>

      {/* Retake warning modal */}
      {showRetakeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 text-warning-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-semibold">Retake Warning</h3>
            </div>
            <p className="mb-6 text-sm text-slate-300">
              Your current result is <strong className="text-success-400">Pass</strong>. Starting a new attempt will replace this. Your new result will become your current one, even if it&apos;s lower. Are you sure?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRetakeWarning(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={startNewAttempt}
                className="rounded-lg bg-warning-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-warning-400"
              >
                Yes, Retake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result display */}
      {sessionComplete && currentSession && (
        <div className={`shrink-0 rounded-lg p-4 my-3 ${
          currentSession.result === 'pass'
            ? 'border border-success-500/30 bg-success-500/10'
            : currentSession.result === 'developing'
            ? 'border border-warning-500/30 bg-warning-500/10'
            : 'border border-danger-500/30 bg-danger-500/10'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">Result:</span>
            <StatusBadge status={currentSession.result!} size="md" />
          </div>
          {currentSession.completed_at && (
            <p className="mt-1 text-xs text-slate-500">
              Completed {format(new Date(currentSession.completed_at), 'PPp')}
            </p>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && !currentSession && (
          <EmptyState
            icon={<BookCheck className="h-10 w-10" />}
            title="No attempts yet"
            description="Click Start to begin your first knowledge check attempt."
          />
        )}

        {messages.length === 0 && currentSession && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">Start typing your response below.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                <Bot className="h-4 w-4 text-brand-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'border border-slate-800 bg-slate-900 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`mt-1 text-xs ${msg.role === 'user' ? 'text-brand-200' : 'text-slate-600'}`}>
                {format(new Date(msg.created_at), 'p')}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {currentSession && !sessionComplete && (
        <form onSubmit={handleSendMessage} className="shrink-0 flex items-end gap-3 border-t border-slate-800 pt-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Type your response..."
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  );
}
