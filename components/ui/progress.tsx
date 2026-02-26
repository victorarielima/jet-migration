'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-secondary relative h-2.5 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-gradient-to-r from-primary via-primary to-primary/80 h-full w-full flex-1 rounded-full transition-all duration-500 ease-out relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-[shine_2s_ease-in-out_infinite]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
