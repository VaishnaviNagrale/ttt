import { Cell }      from './Cell'
import { useStore }  from '@/store/gameStore'
import { useGame }   from '@/hooks/useGame'

export function Board({ winCombo }) {
  const { board, currentTurn, myUsername } = useStore()
  const { sendMove } = useGame()

  const isMyTurn = currentTurn === myUsername

  return (
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[360px]">
      {board.map((val, i) => (
        <Cell
          key={i}
          value={val}
          onClick={() => isMyTurn && val === '' && sendMove(i)}
          isWinCell={winCombo?.includes(i)}
          disabled={!isMyTurn}
        />
      ))}
    </div>
  )
}
