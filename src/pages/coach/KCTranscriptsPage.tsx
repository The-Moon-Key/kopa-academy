import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import type {
  KnowledgeCheckSession,
  KnowledgeCheckQuestion,
  KnowledgeCheckMessage,
  Profile,
} from '../../types';
import { format } from 'date-fns';
import { MessageSquare, Loader2, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';

interface SessionWithContext extends KnowledgeCheckSession {
  question?: KnowledgeCheckQuestion;
  apprentice?: Profile;
}

export function KCTranscriptsPage() {
  const { profile } = useAppStore();
  const [sessions, setSessions] = useState<SessionWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, KnowledgeCheckMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) fetchSessions();
  }, [profile?.id]);

  async function fetchSessions() {
    setLoading(true);
    setError(null);
    try {
      // Get assigned apprentices
      const { data: apprentices } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_coach_id', profile!.id);

      const assignedApprentices = (apprentices as Profile[]) || [];
      const apprenticeIds = assignedApprentices.map((a) => a.id);

      if (apprenticeIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get KC sessions
      const { data: sessionsData } = await supabase
        .from('knowledge_check_sessions')
        .select('*')
        .in('apprentice_id', apprenticeIds)
        .order('started_at', { ascending: false })
        .limit(50);

      const fetchedSessions = (sessionsData as KnowledgeCheckSession[]) || [];

      // Get questions for context
      const questionIds = [...new Set(fetchedSessions.map((s) => s.question_id))];
      let questions: KnowledgeCheckQuestion[] = [];
      if (questionIds.length > 0) {
        const { data: questionsData } = await supabase
          .from('knowledge_check_questions')
          .select('*')
          .in('id', questionIds);
        questions = (questionsData as KnowledgeCheckQuestion[]) || [];
      }

      const enriched: SessionWithContext[] = fetchedSessions.map((s) => ({
        ...s,
        question: questions.find((q) => q.id === s.question_id),
        apprentice: assignedApprentices.find((a) => a.id === s.apprentice_id),
      }));

      setSessions(enriched);
    } catch {
      setError('Failed to load KC transcripts.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTranscript(sessionId: string) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }

    setExpandedSession(sessionId);

    if (!messages[sessionId]) {
      setLoadingMessages(sessionId);
      try {
        const { data: messagesData } = await supabase
          .from('knowledge_check_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('sequence');
        setMessages((prev) => ({ ...prev, [sessionId]: (messagesData as KnowledgeCheckMessage[]) || [] }));
      } catch {
        setMessages((prev) => ({ ...prev, [sessionId]: [] }));
      } finally {
        setLoadingMessages(null);
      }
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
        icon={<MessageSquare className="h-12 w-12" />}
        title="Unable to load transcripts"
        description={error}
        action={
          <button onClick={fetchSessions} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title="No KC transcripts"
        description="Knowledge check transcripts will appear here when your apprentices complete sessions."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">KC Transcripts</h1>
        <p className="mt-1 text-sm text-slate-500">Review knowledge check sessions for your apprentices</p>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const sessionMessages = messages[session.id] || [];

          return (
            <div key={session.id} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
              <button
                onClick={() => toggleTranscript(session.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">
                      {session.apprentice?.full_name || 'Unknown'}
                    </span>
                    {session.result && <StatusBadge status={session.result} />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {session.question?.question_text || `Question #${session.question_id}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {format(new Date(session.started_at), 'PPp')}
                    {' '}| Attempt #{session.attempt_number}
                  </p>
                </div>
                <div className="shrink-0 ml-3">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4">
                  {loadingMessages === session.id ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                    </div>
                  ) : sessionMessages.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No messages in this session.</p>
                  ) : (
                    <div className="space-y-3">
                      {sessionMessages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? '' : ''}`}>
                          <div className="shrink-0">
                            {msg.role === 'user' ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700">
                                <User className="h-3 w-3 text-slate-300" />
                              </div>
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20">
                                <Bot className="h-3 w-3 text-brand-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-400 mb-0.5">
                              {msg.role === 'user' ? session.apprentice?.full_name || 'Apprentice' : 'AI Evaluator'}
                            </p>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
