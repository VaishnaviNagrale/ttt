import { cn } from '@/lib/utils'
import { useStore } from '@/store/gameStore'

export function TimerBar() {
  const { timedMode, timerRemaining } = useStore()
  if (!timedMode) return null

  const pct    = Math.max(0, (timerRemaining / 30) * 100)
  const urgent = timerRemaining <= 8

  return (
    <div className="w-full">
      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-[900ms] linear',
            urgent ? 'bg-danger' : 'bg-accent',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn(
        'font-mono text-[11px] text-center mt-1 transition-colors duration-300',
        urgent ? 'text-danger animate-timer-urgent' : 'text-muted',
      )}>
        {timerRemaining}s
      </p>
    </div>
  )
}
