import { Client } from '@heroiclabs/nakama-js'

// ─── All config comes from environment variables ────────────────────────────
// Set these in Netlify dashboard → Site settings → Environment variables
const HOST    = import.meta.env.VITE_NAKAMA_HOST    || 'localhost'
const PORT    = import.meta.env.VITE_NAKAMA_PORT    || '7350'
const USE_SSL = import.meta.env.VITE_NAKAMA_USE_SSL === 'true'
const KEY     = import.meta.env.VITE_NAKAMA_KEY     || 'defaultkey'

export const nakamaClient = new Client(KEY, HOST, PORT, USE_SSL)

// ─── Stable device ID stored in localStorage ────────────────────────────────
export function getDeviceId() {
  let id = localStorage.getItem('ttt_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ttt_device_id', id)
  }
  return id
}

// ─── Auth: device-based (no passwords, seamless re-auth on return) ──────────
export async function authenticate(username) {
  const deviceId = getDeviceId()
  // create=true creates account on first login; username updates display name
  const session = await nakamaClient.authenticateDevice(deviceId, true, username)
  return session
}

// ─── Socket factory ──────────────────────────────────────────────────────────
export function makeSocket() {
  // verbose=false keeps console clean in prod
  return nakamaClient.createSocket(USE_SSL, false)
}

// ─── Matchmaking ticket ─────────────────────────────────────────────────────
// query filters by mode so timed players only match with timed players
export async function addToMatchmaker(socket, timedMode) {
  const query    = timedMode ? '+properties.mode:timed' : '+properties.mode:classic'
  const strProps = { mode: timedMode ? 'timed' : 'classic' }
  return socket.addMatchmaker(query, 2, 2, strProps, {})
}

// ─── RPCs ────────────────────────────────────────────────────────────────────
export async function fetchLeaderboard(session) {
  try {
    const res = await nakamaClient.rpc(session, 'get_leaderboard', {})
    return res?.payload?.leaderboard ?? []
  } catch {
    return []
  }
}
