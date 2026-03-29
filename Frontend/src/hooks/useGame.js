import { useCallback, useRef } from 'react'
import { useStore, PHASE, OP } from '@/store/gameStore'
import {
  authenticate,
  makeSocket,
  addToMatchmaker,
  fetchLeaderboard,
} from '@/lib/nakama'

/**
 * useGame
 * Manages the full Nakama lifecycle:
 *   authenticate → open socket → join matchmaker → wait for match →
 *   join match → receive events → send moves → game over → cleanup
 *
 * All server events map 1-to-1 with the Lua broadcast shapes.
 */
export function useGame() {
  const socketRef  = useRef(null)
  const sessionRef = useRef(null)
  const ticketRef  = useRef(null)   // matchmaker ticket for cancellation

  const {
    setSession, setPhase, setMatchId,
    setStatusMsg, setErrorMsg, setConnecting, setLeaderboard,
    onGameStart, onBoardUpdate, onTimer, onGameOver,
    resetMatch,
  } = useStore()

  // ─── Attach all socket event handlers ──────────────────────────────────
  const attachSocketHandlers = useCallback((socket, session) => {

    // Matchmaker found a pair → join the match
    socket.onmatchmakermatched = async (matched) => {
      try {
        setStatusMsg('Opponent found! Joining match…')
        const match = await socket.joinMatch(matched.match_id, matched.token)
        setMatchId(match.match_id)
        // phase will change to GAME when server sends game_start
      } catch (err) {
        setErrorMsg('Failed to join match: ' + err.message)
        setPhase(PHASE.NICKNAME)
      }
    }

    // All real-time game messages arrive here
    socket.onmatchdata = async (data) => {
      let msg
      try {
        msg = JSON.parse(new TextDecoder().decode(data.data))
      } catch {
        return
      }

      switch (msg.type) {
        case 'waiting':
          // First player in match is waiting for second
          setStatusMsg('Waiting for opponent to join…')
          break

        case 'game_start':
          // Both players present — server starts the game
          useStore.getState().onGameStart({
            ...msg,
            matchId: data.match_id,
          })
          break

        case 'board_update':
          // A move was validated and applied by server
          useStore.getState().onBoardUpdate(msg)
          break

        case 'timer':
          // Server broadcasts countdown every tick in timed mode
          useStore.getState().onTimer(msg.remaining)
          break

        case 'game_over':
          // Game ended (win / draw / timeout / opponent_left)
          useStore.getState().onGameOver(msg)
          // Refresh leaderboard from server
          fetchLeaderboard(session).then(rows => {
            if (rows.length) setLeaderboard(rows)
          })
          break

        case 'error':
          // Server rejected a move
          setStatusMsg('⚠ ' + msg.message)
          break

        case 'server_shutdown':
          setErrorMsg('Server is restarting. Please reconnect.')
          setPhase(PHASE.NICKNAME)
          break

        default:
          break
      }
    }

    socket.ondisconnect = (evt) => {
      setStatusMsg('Disconnected — check your connection')
    }

    socket.onerror = (err) => {
      setErrorMsg('Connection error. Please try again.')
    }
  }, [setSession, setPhase, setMatchId, setStatusMsg, setErrorMsg, setLeaderboard])

  // ─── Start full flow ────────────────────────────────────────────────────
  const startMatchmaking = useCallback(async (username, timedMode) => {
    setErrorMsg('')
    setConnecting(true)
    setPhase(PHASE.WAITING)

    try {
      // 1. Authenticate with Nakama (device-based, persistent)
      setStatusMsg('Authenticating…')
      const session = await authenticate(username)
      sessionRef.current = session
      setSession(session)

      // 2. Open real-time WebSocket
      setStatusMsg('Connecting to server…')
      const socket = makeSocket()
      await socket.connect(session, true)
      socketRef.current = socket
      attachSocketHandlers(socket, session)

      // 3. Enter matchmaker queue
      setStatusMsg('Finding opponent…')
      const ticket = await addToMatchmaker(socket, timedMode)
      ticketRef.current = ticket

    } catch (err) {
      setErrorMsg(
        err?.message?.includes('Failed to fetch')
          ? 'Cannot reach Nakama server. Check VITE_NAKAMA_HOST.'
          : 'Error: ' + err.message
      )
      setPhase(PHASE.NICKNAME)
    } finally {
      setConnecting(false)
    }
  }, [attachSocketHandlers, setSession, setPhase, setStatusMsg, setErrorMsg, setConnecting])

  // ─── Cancel matchmaking ──────────────────────────────────────────────────
  const cancelMatchmaking = useCallback(async () => {
    try {
      if (socketRef.current && ticketRef.current) {
        await socketRef.current.removeMatchmaker(ticketRef.current.ticket)
      }
      socketRef.current?.disconnect(true)
    } catch (_) {}
    socketRef.current = null
    sessionRef.current = null
    ticketRef.current = null
    resetMatch()
    setPhase(PHASE.NICKNAME)
  }, [resetMatch, setPhase])

  // ─── Send a move to the server ───────────────────────────────────────────
  // position is 0-indexed from the UI; server expects 1-indexed (Lua table)
  const sendMove = useCallback(async (position) => {
    const socket  = socketRef.current
    const matchId = useStore.getState().matchId
    if (!socket || !matchId) return

    try {
      await socket.sendMatchState(
        matchId,
        OP.MOVE,
        JSON.stringify({ type: 'move', position: position + 1 })
      )
    } catch (err) {
      setErrorMsg('Move failed: ' + err.message)
    }
  }, [setErrorMsg])

  // ─── Leave match + reset (play again / home) ─────────────────────────────
  const leaveAndReset = useCallback(async () => {
    try {
      const matchId = useStore.getState().matchId
      if (socketRef.current && matchId) {
        await socketRef.current.leaveMatch(matchId)
      }
      socketRef.current?.disconnect(true)
    } catch (_) {}
    socketRef.current = null
    sessionRef.current = null
    ticketRef.current = null
    resetMatch()
    setPhase(PHASE.NICKNAME)
  }, [resetMatch, setPhase])

  return { startMatchmaking, cancelMatchmaking, sendMove, leaveAndReset }
}
