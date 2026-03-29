import { useStore, PHASE } from '@/store/gameStore'
import { NicknameScreen }  from '@/pages/NicknameScreen'
import { WaitingScreen }   from '@/pages/WaitingScreen'
import { GameScreen }      from '@/pages/GameScreen'
import { ResultScreen }    from '@/pages/ResultScreen'

export default function App() {
  const { phase } = useStore()

  return (
    <>
      {phase === PHASE.NICKNAME && <NicknameScreen />}
      {phase === PHASE.WAITING  && <WaitingScreen />}
      {phase === PHASE.GAME     && <GameScreen />}
      {phase === PHASE.RESULT   && <ResultScreen />}
    </>
  )
}
