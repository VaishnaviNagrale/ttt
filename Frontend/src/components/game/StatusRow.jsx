import { useStore } from '@/store/gameStore'

export function StatusRow() {
  const { statusMsg } = useStore()
  return (
    <div className="w-full flex items-center justify-center gap-1.5 min-h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot flex-shrink-0" />
      <span className="text-[12px] font-mono text-muted">{statusMsg || 'Connected'}</span>
    </div>
  )
}
