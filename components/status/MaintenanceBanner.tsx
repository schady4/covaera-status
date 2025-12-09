'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ComponentType, componentLabels } from '@/lib/utils/status-levels'
import { formatDateTime } from '@/lib/utils/date-helpers'
import { Wrench } from 'lucide-react'

interface Maintenance {
  _id: string
  title: string
  description: string
  affectedComponents: ComponentType[]
  scheduledStart: Date | string
  scheduledEnd: Date | string
  status: 'scheduled' | 'in_progress' | 'completed'
}

interface MaintenanceBannerProps {
  maintenance: Maintenance[]
}

export function MaintenanceBanner({ maintenance }: MaintenanceBannerProps) {
  // Filter to only show scheduled or in-progress maintenance
  const activeMaintenance = maintenance.filter(
    (m) => m.status === 'scheduled' || m.status === 'in_progress'
  )

  if (activeMaintenance.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {activeMaintenance.map((m) => (
        <Alert
          key={m._id}
          className="border-secondary bg-secondary/10"
        >
          <Wrench className="h-4 w-4 text-secondary" />
          <AlertTitle className="text-secondary">
            {m.status === 'in_progress'
              ? 'Maintenance In Progress'
              : 'Scheduled Maintenance'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="font-medium">{m.title}</p>
            <p className="text-sm">{m.description}</p>
            <div className="flex flex-wrap gap-1 text-xs">
              {m.affectedComponents.map((c) => (
                <span
                  key={c}
                  className="rounded bg-secondary/20 px-1.5 py-0.5"
                >
                  {componentLabels[c]}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {m.status === 'in_progress' ? (
                <>Expected completion: {formatDateTime(m.scheduledEnd)}</>
              ) : (
                <>
                  Scheduled: {formatDateTime(m.scheduledStart)} -{' '}
                  {formatDateTime(m.scheduledEnd)}
                </>
              )}
            </p>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
