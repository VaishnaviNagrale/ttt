import { cn } from '@/lib/utils'

export function Cell({ value, onClick, isWinCell, disabled }) {
  const empty = value === ''

  return (
    <button
      onClick={onClick}
      disabled={disabled || !empty}
      aria-label={empty ? 'Empty cell' : `Cell ${value}`}
      className={cn(
        'aspect-square bg-surface border-[1.5px] border-border rounded-2xl',
        'flex items-center justify-center',
        'text-[36px] font-extrabold font-mono',
        'transition-all duration-150 select-none',
        // hoverable when empty and it's your turn
        empty && !disabled && 'hover:border-accent hover:bg-surface2 hover:scale-[1.03] cursor-pointer',
        // taken cell
        !empty && 'cursor-default',
        // not your turn
        disabled && empty && 'cursor-not-allowed opacity-60',
        // winning cells
        isWinCell && 'bg-surface2 border-accent animate-win-flash',
      )}
    >
      {value && (
        <span className={cn(
          'animate-pop-in',
          value === 'X' ? 'text-danger' : 'text-accent',
        )}>
          {value}
        </span>
      )}
    </button>
  )
}
