import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EmptyState } from '../../components/EmptyState';
import type { AuditLog } from '../../types';
import { format } from 'date-fns';
import { ScrollText, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface AuditLogWithActor extends AuditLog {
  profiles?: { full_name: string } | null;
}

const PAGE_SIZE = 20;

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, actionFilter]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('audit_log')
        .select('*, profiles!actor_id(full_name)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

      if (actionFilter.trim()) {
        query = query.ilike('action', `%${actionFilter.trim()}%`);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const results = (data as AuditLogWithActor[]) || [];
      setHasMore(results.length > PAGE_SIZE);
      setLogs(results.slice(0, PAGE_SIZE));
    } catch {
      setError('Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(value: string) {
    setActionFilter(value);
    setPage(0);
  }

  if (error && logs.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="h-12 w-12" />}
        title="Unable to load audit log"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">System activity and change history</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder="Filter by action type..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-12 w-12" />}
          title="No audit log entries"
          description={actionFilter ? 'No entries match your filter.' : 'No activity has been recorded yet.'}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Actor</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  <th className="hidden px-4 py-3 font-medium text-slate-400 md:table-cell">Entity Type</th>
                  <th className="hidden px-4 py-3 font-medium text-slate-400 md:table-cell">Entity ID</th>
                  <th className="hidden px-4 py-3 font-medium text-slate-400 lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                      {format(new Date(log.created_at), 'PP p')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">
                      {log.profiles?.full_name || log.actor_id.slice(0, 8) + '...'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 md:table-cell">
                      {log.entity_type || '-'}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell font-mono">
                      {log.entity_id ? log.entity_id.slice(0, 12) + '...' : '-'}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {log.details ? (
                        <code className="block max-w-xs truncate rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">
                          {JSON.stringify(log.details)}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page + 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
