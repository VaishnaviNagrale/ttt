import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-accent text-bg hover:brightness-110 hover:-translate-y-px active:scale-[0.98]',
  secondary: 'bg-transparent text-muted border border-border hover:text-txt hover:border-muted mt-2.5',
}

export function Button({ children, variant = 'primary', className, disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'w-full py-3.5 rounded-[10px] font-display font-extrabold text-sm',
        'uppercase tracking-wider cursor-pointer transition-all duration-200',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
