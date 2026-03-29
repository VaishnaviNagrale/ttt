import { create } from 'zustand'

export const PHASE = {
  NICKNAME: 'nickname',
  WAITING:  'waiting',
  GAME:     'game',
  RESULT:   'result',
}

// Op-codes must match the Lua server
export const OP = {
  MOVE:       1,
  GAME_STATE: 2,
  TIMER:      3,
}

export const useStore = create((set, get) => ({
  // ── Identity
  session:       null,
  myUsername:    '',
  myMark:        null,
  opponentName:  null,
  opponentMark:  null,

  // ── Match
  matchId:       null,
  phase:         PHASE.NICKNAME,
  timedMode:     false,

  // ── Live game
  board:          Array(9).fill(''),
  currentTurn:    null,
  timerRemaining: 30,

  // ── Result  { winner, winCombo, reason, marks }
  result:        null,

  // ── Leaderboard
  leaderboard:   [],

  // ── UI
  statusMsg:     '',
  errorMsg:      '',
  connecting:    false,

  // ──────── Setters ────────────────────────────────────────────────────────
  setSession:      (s)   => set({ session: s }),
  setPhase:        (p)   => set({ phase: p }),
  setMyUsername:   (n)   => set({ myUsername: n }),
  setTimedMode:    (v)   => set({ timedMode: v }),
  setMatchId:      (id)  => set({ matchId: id }),
  setStatusMsg:    (msg) => set({ statusMsg: msg }),
  setErrorMsg:     (msg) => set({ errorMsg: msg }),
  setConnecting:   (v)   => set({ connecting: v }),
  setLeaderboard:  (rows)=> set({ leaderboard: rows }),

  // ──────── Game event handlers (called from socket) ───────────────────────

  onGameStart({ board, marks, turn, timed, matchId }) {
    const { myUsername } = get()
    const myMark       = marks[myUsername]
    const opponentName = Object.keys(marks).find(k => k !== myUsername) ?? 'Opponent'
    set({
      board,
      currentTurn:    turn,
      myMark,
      opponentName,
      opponentMark:   marks[opponentName],
      timedMode:      !!timed,
      timerRemaining: 30,
      matchId,
      phase:          PHASE.GAME,
      statusMsg:      turn === myUsername ? 'Your turn' : `${opponentName}'s turn`,
    })
  },

  onBoardUpdate({ board, turn }) {
    const { myUsername } = get()
    set({
      board,
      currentTurn:    turn,
      timerRemaining: 30,
      statusMsg:      turn === myUsername ? 'Your turn' : 'Opponent thinking…',
    })
  },

  onTimer(remaining) {
    set({ timerRemaining: remaining })
  },

  onGameOver({ board, winner, win_combo, reason, marks }) {
    set({
      board,
      phase:  PHASE.RESULT,
      result: { winner, winCombo: win_combo, reason, marks },
    })
  },

  // ──────── Reset ──────────────────────────────────────────────────────────
  resetMatch() {
    set({
      matchId:        null,
      myMark:         null,
      opponentName:   null,
      opponentMark:   null,
      board:          Array(9).fill(''),
      currentTurn:    null,
      timerRemaining: 30,
      result:         null,
      statusMsg:      '',
      errorMsg:       '',
      connecting:     false,
    })
  },
}))
