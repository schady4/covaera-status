import { connectToDatabase } from '@/lib/database'
import { Incident } from '@/lib/database/models'
import { IncidentForm } from '@/components/admin/IncidentForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  componentLabels,
  incidentStatusLabels,
  severityLabels,
} from '@/lib/utils/status-levels'
import { formatDateTime } from '@/lib/utils/date-helpers'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Pencil } from 'lucide-react'

async function getIncidents() {
  await connectToDatabase()

  const incidents = await Incident.find({})
    .sort({ startedAt: -1 })
    .limit(50)
    .lean()

  return incidents.map((i) => ({
    ...i,
    _id: i._id.toString(),
  }))
}

export default async function IncidentsPage() {
  const incidents = await getIncidents()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Incident Management</h1>
        <p className="text-muted-foreground">
          Create and manage incidents
        </p>
      </div>

      {/* Create New Incident */}
      <IncidentForm />

      {/* Incident List */}
      <Card>
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents yet</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex gap-3">
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 text-status-operational" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-status-major" />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{incident.title}</span>
                        <Badge
                          variant={
                            incident.severity === 'critical'
                              ? 'major'
                              : incident.severity === 'major'
                              ? 'partial'
                              : 'degraded'
                          }
                        >
                          {severityLabels[incident.severity as keyof typeof severityLabels]}
                        </Badge>
                        <Badge
                          variant={
                            incident.status === 'resolved'
                              ? 'operational'
                              : 'outline'
                          }
                        >
                          {incidentStatusLabels[incident.status as keyof typeof incidentStatusLabels]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {incident.affectedComponents.map((c: string) => (
                          <span
                            key={c}
                            className="rounded bg-muted px-1.5 py-0.5"
                          >
                            {componentLabels[c as keyof typeof componentLabels]}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started: {formatDateTime(incident.startedAt)}
                        {incident.resolvedAt && (
                          <> | Resolved: {formatDateTime(incident.resolvedAt)}</>
                        )}
                      </p>
                      {incident.updates && incident.updates.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Latest: {incident.updates[incident.updates.length - 1].message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/incidents/${incident._id}`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
