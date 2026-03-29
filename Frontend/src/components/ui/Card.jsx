import { cn } from '@/lib/utils'

export function Card({ children, className }) {
  return (
    <div className={cn(
      'relative bg-surface border border-border rounded-[20px] p-8',
      'w-[360px] max-w-[95vw] overflow-hidden',
      className,
    )}>
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      {children}
    </div>
  )
}
