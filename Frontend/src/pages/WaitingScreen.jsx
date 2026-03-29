import { Logo }    from '@/components/ui/Logo'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { useStore } from '@/store/gameStore'
import { useGame }  from '@/hooks/useGame'

export function WaitingScreen() {
  const { matchId, statusMsg } = useStore()
  const { cancelMatchmaking }  = useGame()

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
      <Card>
        <Logo />

        <h1 className="text-[28px] font-extrabold leading-[1.1] mb-1.5 font-display">
          Finding a<br />random player...
        </h1>
        <p className="text-muted text-[13px] font-mono mb-7">
          It usually takes a few seconds.
        </p>

        {/* Animated dots */}
        <div className="flex gap-1.5 justify-center my-6">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-bounce-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Live status / match ID */}
        <div className="bg-surface2 border border-dashed border-border rounded-lg px-3.5 py-2.5 font-mono text-[11px] text-muted text-center mb-5 break-all leading-relaxed">
          {matchId
            ? `match_id: ${matchId}`
            : (statusMsg || 'Searching…')}
        </div>

        <Button variant="secondary" onClick={cancelMatchmaking}>
          Cancel
        </Button>
      </Card>
    </div>
  )
}
