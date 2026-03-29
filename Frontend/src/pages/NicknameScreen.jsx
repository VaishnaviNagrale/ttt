import { useState } from 'react'
import { Logo }    from '@/components/ui/Logo'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Toggle }  from '@/components/ui/Toggle'
import { useStore } from '@/store/gameStore'
import { useGame }  from '@/hooks/useGame'
import { cn }       from '@/lib/utils'

export function NicknameScreen() {
  const [name, setName]   = useState('')
  const [timed, setTimed] = useState(false)
  const [busy, setBusy]   = useState(false)

  const { errorMsg, setErrorMsg, setMyUsername, setTimedMode } = useStore()
  const { startMatchmaking } = useGame()

  const canSubmit = name.trim().length >= 2 && !busy

  const handleSubmit = async () => {
    if (!canSubmit) return
    const trimmed = name.trim()
    setBusy(true)
    setErrorMsg('')
    setMyUsername(trimmed)
    setTimedMode(timed)
    await startMatchmaking(trimmed, timed)
    setBusy(false)
  }

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
      <Card>
        <Logo />

        <h1 className="text-[28px] font-extrabold leading-[1.1] mb-1.5 font-display">
          Who are you?
        </h1>
        <p className="text-muted text-[13px] font-mono mb-7">
          Pick a nickname to enter the arena
        </p>

        <label className="block text-[11px] font-mono uppercase tracking-[0.1em] text-muted mb-2">
          Nickname
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nickname"
          maxLength={16}
          autoFocus
          className={cn(
            'w-full bg-surface2 border border-border rounded-lg px-4 py-3 mb-5',
            'text-txt text-[15px] font-display font-semibold',
            'placeholder:text-muted placeholder:font-normal',
            'outline-none focus:border-accent transition-colors duration-150',
          )}
        />

        <Toggle
          checked={timed}
          onChange={setTimed}
          label="Timed Mode"
          sublabel="30 sec / move"
        />

        {errorMsg && (
          <p className="text-danger text-xs font-mono text-center mb-3 leading-relaxed">
            {errorMsg}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {busy
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin-slow" />
                Connecting…
              </span>
            : 'Continue'
          }
        </Button>
      </Card>
    </div>
  )
}
