'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ComponentType,
  IncidentStatus,
  IncidentSeverity,
  componentLabels,
  incidentStatusLabels,
  severityLabels,
  severityColors,
} from '@/lib/utils/status-levels'
import {
  formatDateTime,
  formatDayHeader,
  formatDuration,
  groupByDay,
} from '@/lib/utils/date-helpers'
import { cn } from '@/lib/utils/cn'
import { AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react'

interface IncidentUpdate {
  status: IncidentStatus
  message: string
  timestamp: Date | string
}

interface Incident {
  _id: string
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  affectedComponents: ComponentType[]
  updates: IncidentUpdate[]
  startedAt: Date | string
  resolvedAt: Date | string | null
}

interface IncidentTimelineProps {
  incidents: Incident[]
  daysToShow?: number
}

const statusIcons: Record<IncidentStatus, React.ElementType> = {
  investigating: Search,
  identified: AlertTriangle,
  monitoring: Clock,
  resolved: CheckCircle,
}

function IncidentCard({ incident }: { incident: Incident }) {
  const isResolved = incident.status === IncidentStatus.RESOLVED
  const StatusIcon = statusIcons[incident.status]

  return (
    <Card className={cn(isResolved && 'opacity-75')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <StatusIcon
            className={cn(
              'mt-0.5 h-5 w-5 flex-shrink-0',
              isResolved ? 'text-status-operational' : 'text-status-major'
            )}
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{incident.title}</h4>
              <Badge
                variant={
                  incident.severity === 'critical'
                    ? 'major'
                    : incident.severity === 'major'
                    ? 'partial'
                    : 'degraded'
                }
              >
                {severityLabels[incident.severity]}
              </Badge>
              <Badge variant={isResolved ? 'operational' : 'outline'}>
                {incidentStatusLabels[incident.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              {incident.affectedComponents.map((c) => (
                <span
                  key={c}
                  className="rounded bg-muted px-1.5 py-0.5"
                >
                  {componentLabels[c]}
                </span>
              ))}
            </div>

            {/* Latest update */}
            {incident.updates.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {incident.updates[incident.updates.length - 1].message}
              </p>
            )}

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Started: {formatDateTime(incident.startedAt)}</span>
              {incident.resolvedAt && (
                <span>
                  Duration:{' '}
                  {formatDuration(incident.startedAt, incident.resolvedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function IncidentTimeline({
  incidents,
  daysToShow = 7,
}: IncidentTimelineProps) {
  // Group incidents by day
  const groupedIncidents = groupByDay(
    incidents.map((i) => ({ ...i, timestamp: i.startedAt }))
  )

  // Generate last N days
  const days: string[] = []
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayIncidents = groupedIncidents.get(day) || []

        return (
          <div key={day} className="space-y-3">
            <h3 className="font-semibold text-muted-foreground">
              {formatDayHeader(day)}
            </h3>
            {dayIncidents.length > 0 ? (
              <div className="space-y-3">
                {dayIncidents.map((incident) => (
                  <IncidentCard
                    key={incident._id}
                    incident={incident as Incident}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No incidents reported
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
