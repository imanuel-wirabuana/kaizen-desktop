import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonGroupVariants = cva(
  'inline-flex items-center select-none',
  {
    variants: {
      variant: {
        default:
          'rounded-lg border border-border/70 bg-muted/40 p-0.5 gap-0.5 shadow-2xs backdrop-blur-xs',
        connected:
          '-space-x-px rounded-lg shadow-2xs [&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:only-child]:rounded-lg [&>button:focus-visible]:z-10 [&>[data-slot=button]]:rounded-none [&>[data-slot=button]:first-child]:rounded-l-lg [&>[data-slot=button]:last-child]:rounded-r-lg [&>[data-slot=button]:only-child]:rounded-lg',
        outline:
          'rounded-lg border border-border/80 bg-background/50 p-0.5 gap-0.5 shadow-2xs',
        ghost:
          'rounded-lg p-0.5 gap-0.5 bg-transparent'
      },
      size: {
        default: 'h-7',
        sm: 'h-6',
        lg: 'h-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {}

export function ButtonGroup({
  className,
  variant,
  size,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(buttonGroupVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonGroupVariants }
