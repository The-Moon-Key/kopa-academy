interface TierBadgeProps {
  tier: number;
  size?: 'sm' | 'md';
}

const tierConfig: Record<number, { label: string; classes: string }> = {
  0: { label: 'None', classes: 'bg-slate-700/40 text-slate-400 border-slate-600/30' },
  1: { label: 'Foundations', classes: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
  2: { label: 'Practitioner', classes: 'bg-success-500/20 text-success-400 border-success-500/30' },
  3: { label: 'Mastery', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
};

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const config = tierConfig[tier] || tierConfig[0];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.classes} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
