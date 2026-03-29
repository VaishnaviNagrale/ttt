import { cn } from '@/lib/utils'

export function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <div className="flex items-center justify-between bg-surface2 border border-border rounded-[10px] px-4 py-3.5 mb-6">
      <div>
        <p className="text-sm font-semibold text-txt">{label}</p>
        {sublabel && <p className="text-[11px] font-mono text-muted mt-0.5">{sublabel}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-accent' : 'bg-border',
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200',
          checked ? 'left-[22px] bg-bg' : 'left-0.5 bg-muted',
        )} />
      </button>
    </div>
  )
}
