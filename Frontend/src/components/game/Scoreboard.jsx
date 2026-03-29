import { cn } from '@/lib/utils'
import { useStore } from '@/store/gameStore'

function PlayerPill({ mark, name, tag }) {
  const color = mark === 'X' ? 'text-danger' : 'text-accent'
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className={cn('text-[28px] font-extrabold font-mono leading-none', color)}>
        {mark}
      </span>
      <span className="text-[12px] text-muted font-mono max-w-[80px] truncate">{name ?? '…'}</span>
      <span className="text-[10px] text-accent tracking-widest uppercase">{tag}</span>
    </div>
  )
}

export function Scoreboard() {
  const { myUsername, myMark, opponentName, board } = useStore()

  const movesPlayed = board.filter(Boolean).length
  const activeMark  = movesPlayed % 2 === 0 ? 'X' : 'O'
  const xIsMe       = myMark === 'X'

  return (
    <div className="flex items-center justify-between w-full bg-surface border border-border rounded-2xl px-5 py-4 gap-3">
      <PlayerPill
        mark="X"
        name={xIsMe ? myUsername : opponentName}
        tag={xIsMe ? 'you' : 'opp'}
      />

      {/* Turn bubble */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted">Turn</span>
        <div className={cn(
          'w-9 h-9 rounded-full border-2 flex items-center justify-center',
          'text-base font-extrabold font-mono transition-all duration-300',
          activeMark === 'X'
            ? 'border-danger text-danger shadow-[0_0_12px_rgba(255,77,109,0.35)]'
            : 'border-accent text-accent shadow-[0_0_12px_rgba(0,229,160,0.35)]',
        )}>
          {activeMark}
        </div>
      </div>

      <PlayerPill
        mark="O"
        name={xIsMe ? opponentName : myUsername}
        tag={xIsMe ? 'opp' : 'you'}
      />
    </div>
  )
}
