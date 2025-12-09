'use client'

import { cn } from '@/lib/utils/cn'
import { StatusLevel, statusColors } from '@/lib/utils/status-levels'

interface StatusIndicatorProps {
  status: StatusLevel
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export function StatusIndicator({
  status,
  size = 'md',
  pulse = true,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <span className="relative flex">
      {pulse && status === StatusLevel.OPERATIONAL && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            statusColors[status]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizeClasses[size],
          statusColors[status]
        )}
      />
    </span>
  )
}
