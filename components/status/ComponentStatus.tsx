'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusIndicator } from './StatusIndicator'
import {
  ComponentType,
  StatusLevel,
  componentLabels,
  statusLabels,
} from '@/lib/utils/status-levels'
import { cn } from '@/lib/utils/cn'

interface ComponentStatusProps {
  component: ComponentType
  status: StatusLevel
  responseTime?: number
}

export function ComponentStatus({
  component,
  status,
  responseTime,
}: ComponentStatusProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <StatusIndicator
              status={status}
              size="md"
              pulse={status === StatusLevel.OPERATIONAL}
            />
            <div>
              <h3 className="font-semibold">{componentLabels[component]}</h3>
              <p
                className={cn(
                  'text-sm',
                  status === StatusLevel.OPERATIONAL
                    ? 'text-status-operational'
                    : status === StatusLevel.DEGRADED
                    ? 'text-status-degraded'
                    : status === StatusLevel.PARTIAL_OUTAGE
                    ? 'text-status-partial'
                    : 'text-status-major'
                )}
              >
                {statusLabels[status]}
              </p>
            </div>
          </div>
          {responseTime !== undefined && responseTime > 0 && (
            <span className="text-sm text-muted-foreground">
              {responseTime}ms
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ComponentStatusGridProps {
  components: Array<{
    component: ComponentType
    status: StatusLevel
    responseTime?: number
  }>
}

export function ComponentStatusGrid({ components }: ComponentStatusGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {components.map((c) => (
        <ComponentStatus
          key={c.component}
          component={c.component}
          status={c.status}
          responseTime={c.responseTime}
        />
      ))}
    </div>
  )
}
