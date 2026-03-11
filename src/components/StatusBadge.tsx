import type { LayerStatus } from '../types';

interface StatusBadgeProps {
  status: LayerStatus | 'passed' | 'pass' | 'revision' | 'developing' | 'not_yet' | 'not_attempted';
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  passed: { label: 'Passed', classes: 'bg-success-500/20 text-success-400 border-success-500/30' },
  completed: { label: 'Completed', classes: 'bg-success-500/20 text-success-400 border-success-500/30' },
  revision: { label: 'Revision', classes: 'bg-warning-500/20 text-warning-400 border-warning-500/30' },
  revision_needed: { label: 'Revision Needed', classes: 'bg-warning-500/20 text-warning-400 border-warning-500/30' },
  failed: { label: 'Failed', classes: 'bg-danger-500/20 text-danger-400 border-danger-500/30' },
  pending: { label: 'Pending', classes: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
  locked: { label: 'Locked', classes: 'bg-slate-700/40 text-slate-500 border-slate-600/30' },
  current: { label: 'Current', classes: 'bg-brand-500/20 text-brand-400 border-brand-500/30 ring-1 ring-brand-500/50' },
  developing: { label: 'Developing', classes: 'bg-warning-500/20 text-warning-400 border-warning-500/30' },
  not_yet: { label: 'Not Yet', classes: 'bg-danger-500/20 text-danger-400 border-danger-500/30' },
  not_attempted: { label: 'Not Attempted', classes: 'bg-slate-700/40 text-slate-500 border-slate-600/30' },
  pass: { label: 'Pass', classes: 'bg-success-500/20 text-success-400 border-success-500/30' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-slate-700/40 text-slate-400 border-slate-600/30' };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.classes} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
