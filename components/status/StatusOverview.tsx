'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusIndicator } from './StatusIndicator'
import {
  StatusLevel,
  getOverallStatus,
  getOverallStatusMessage,
  statusTextColors,
} from '@/lib/utils/status-levels'
import { formatRelativeTime } from '@/lib/utils/date-helpers'
import { cn } from '@/lib/utils/cn'

interface StatusOverviewProps {
  componentStatuses: StatusLevel[]
  lastChecked: Date | string | null
}

export function StatusOverview({
  componentStatuses,
  lastChecked,
}: StatusOverviewProps) {
  const overallStatus = getOverallStatus(componentStatuses)
  const statusMessage = getOverallStatusMessage(overallStatus)

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <StatusIndicator status={overallStatus} size="lg" />
          <div>
            <h2
              className={cn(
                'text-2xl font-bold',
                statusTextColors[overallStatus]
              )}
            >
              {statusMessage}
            </h2>
            {lastChecked && (
              <p className="text-sm text-muted-foreground">
                Last checked: {formatRelativeTime(lastChecked)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
