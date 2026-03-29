import { useStore } from '@/store/gameStore'
import { cn } from '@/lib/utils'

/**
 * Builds demo rows when the real Nakama leaderboard RPC returns empty.
 * Once real data arrives from the server, those rows are shown instead.
 */
function buildFallbackRows(result, myUsername, opponentName) {
  const rows = [
    { name: myUsername,   w: 0,  l: 0, d: 0, score: 1800 },
    { name: opponentName, w: 10, l: 2, d: 1, score: 2100 },
  ]
  const me  = rows[0]
  const opp = rows[1]
  const won  = result.winner === myUsername
  const draw = result.reason === 'draw'

  if (draw)      { me.d++; me.score += 25;  opp.d++; opp.score += 25 }
  else if (won)  { me.w++;  me.score += 200; opp.l++;  opp.score -= 50 }
  else           { me.l++;  me.score -= 50;  opp.w++;  opp.score += 200 }

  return rows.sort((a, b) => b.score - a.score)
}

export function Leaderboard() {
  const { result, myUsername, opponentName, leaderboard } = useStore()
  if (!result) return null

  // Prefer real Nakama records; fall back to local estimate
  const rawRows = leaderboard.length
    ? leaderboard.map(r => ({
        name:  r.username || r.user_id,
        w:     r.metadata?.wins   ?? 0,
        l:     r.metadata?.losses ?? 0,
        d:     r.metadata?.draws  ?? 0,
        score: r.score ?? 0,
      }))
    : buildFallbackRows(result, myUsername, opponentName ?? 'Opponent')

  const rows = rawRows.slice(0, 5)

  return (
    <div className="bg-surface2 rounded-xl p-4 mb-5 w-full text-left">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-3">
        <span>🏆</span>
        <span>Leaderboard</span>
        <span className="ml-auto text-[10px] text-muted/60">W/L/D · Score</span>
      </div>

      {rows.map((row, i) => (
        <div
          key={row.name}
          className="flex items-center gap-2.5 py-2 border-b border-border last:border-0 text-[13px]"
        >
          <span className="w-5 font-mono text-[11px] text-muted flex-shrink-0">{i + 1}.</span>

          <span className={cn(
            'flex-1 font-semibold truncate',
            row.name === myUsername ? 'text-accent' : 'text-txt',
          )}>
            {row.name}
            {row.name === myUsername && (
              <span className="ml-1 text-[10px] text-accent/70">(you)</span>
            )}
          </span>

          <span className="font-mono text-[11px] text-muted flex-shrink-0">
            {row.w}/{row.l}/{row.d}
          </span>

          <span className="font-mono font-bold text-accent flex-shrink-0">
            {row.score}
          </span>
        </div>
      ))}
    </div>
  )
}
