export function Logo() {
  return (
    <div className="flex items-center gap-2 mb-7">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
      <span className="text-accent font-mono text-xs tracking-[0.22em] uppercase">
        TicTacToe
      </span>
    </div>
  )
}
