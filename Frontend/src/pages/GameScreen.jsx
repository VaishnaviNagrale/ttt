import { useEffect, useRef } from 'react'
import { Scoreboard } from '@/components/game/Scoreboard'
import { TimerBar }   from '@/components/game/TimerBar'
import { Board }      from '@/components/game/Board'
import { StatusRow }  from '@/components/game/StatusRow'
import { useStore }   from '@/store/gameStore'

/**
 * Local timer countdown between server ticks.
 * The server is authoritative (it sends timer messages every tick),
 * but we also decrement locally for a smooth UI at 1 fps.
 * When the server resets timerRemaining to 30, this effect re-fires.
 */
function useLocalTimer() {
  const { timedMode, timerRemaining, onTimer } = useStore()
  const ref = useRef(null)

  useEffect(() => {
    if (!timedMode) return
    clearInterval(ref.current)
    if (timerRemaining <= 0) return
    ref.current = setInterval(() => {
      const cur = useStore.getState().timerRemaining
      if (cur > 0) onTimer(cur - 1)
      else clearInterval(ref.current)
    }, 1000)
    return () => clearInterval(ref.current)
  }, [timedMode, timerRemaining])
}

export function GameScreen() {
  useLocalTimer()
  // winCombo only available after game ends; during live play it's null
  const { result } = useStore()
  const winCombo = result?.winCombo ?? null

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-[420px]">
        <Scoreboard />
        <TimerBar />
        <Board winCombo={winCombo} />
        <StatusRow />
      </div>
    </div>
  )
}
