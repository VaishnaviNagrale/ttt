import { useEffect } from 'react'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import { Leaderboard } from '@/components/game/Leaderboard'
import { useStore }    from '@/store/gameStore'
import { useGame }     from '@/hooks/useGame'
import { useConfetti } from '@/hooks/useConfetti'
import { cn }          from '@/lib/utils'

export function ResultScreen() {
  const { result, myUsername, myMark, opponentMark } = useStore()
  const { leaveAndReset } = useGame()
  const spawnConfetti = useConfetti()

  if (!result) return null

  const isWinner = result.winner === myUsername
  const isDraw   = result.reason === 'draw'

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isWinner && !isDraw) spawnConfetti()
  }, []) // fire once on mount

  const displayMark = isDraw ? '=' : isWinner ? myMark : opponentMark
  const title       = isDraw ? 'DRAW' : isWinner ? 'WINNER!' : 'DEFEATED'
  const subtitle    = isDraw
    ? 'Great game, nobody wins this one'
    : isWinner
      ? 'You crushed it 🔥'
      : result.reason === 'timeout'
        ? 'You ran out of time'
        : result.reason === 'opponent_left'
          ? 'Opponent disconnected'
          : 'Better luck next time'

  const pts      = isDraw ? '+25 pts' : isWinner ? '+200 pts' : '-50 pts'
  const markColor = displayMark === 'X'
    ? 'text-danger'
    : displayMark === 'O'
      ? 'text-accent'
      : 'text-muted'
  const badgeColor = isWinner || isDraw ? 'text-accent border-accent' : 'text-danger border-danger'

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
      {/* Confetti canvas — positioned fixed so it overlays everything */}
      <canvas
        id="confetti-canvas"
        className="fixed inset-0 pointer-events-none z-50"
      />

      <Card className="text-center animate-fade-scale">
        {/* Big mark */}
        <div className={cn('text-[72px] font-extrabold font-mono leading-none mb-2', markColor)}>
          {displayMark}
        </div>

        <h2 className="text-[22px] font-extrabold font-display mb-1">{title}</h2>
        <p className="text-muted text-[13px] font-mono mb-6">{subtitle}</p>

        {/* Score pill */}
        <span className={cn(
          'inline-block bg-surface2 border font-mono text-[13px] font-bold',
          'px-4 py-1.5 rounded-full mb-6',
          badgeColor,
        )}>
          {pts}
        </span>

        <Leaderboard />

        <Button onClick={leaveAndReset}>Play Again</Button>
        <Button variant="secondary" onClick={leaveAndReset}>Change Nickname</Button>
      </Card>
    </div>
  )
}
