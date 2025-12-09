import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { connectToDatabase } from '@/lib/database'
import { StatusCheck, Incident, Maintenance, Subscriber } from '@/lib/database/models'
import { ComponentType, StatusLevel, statusLabels, componentLabels } from '@/lib/utils/status-levels'
import { calculateUptime } from '@/lib/services/uptime-calculator'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Users,
  Wrench,
} from 'lucide-react'

async function getAdminStats() {
  await connectToDatabase()

  // Get latest status for each component
  const components = Object.values(ComponentType)
  const componentStatuses: Array<{
    component: ComponentType
    status: StatusLevel
    responseTime: number
  }> = []

  for (const component of components) {
    const latest = await StatusCheck.findOne({ component })
      .sort({ timestamp: -1 })
      .lean()

    componentStatuses.push({
      component,
      status: latest ? (latest.status as StatusLevel) : StatusLevel.OPERATIONAL,
      responseTime: latest?.responseTime || 0,
    })
  }

  // Count active incidents
  const activeIncidents = await Incident.countDocuments({
    status: { $ne: 'resolved' },
  })

  // Count upcoming maintenance
  const upcomingMaintenance = await Maintenance.countDocuments({
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledEnd: { $gte: new Date() },
  })

  // Count subscribers
  const subscriberCount = await Subscriber.countDocuments({ verified: true })

  // Get recent incidents
  const recentIncidents = await Incident.find({})
    .sort({ startedAt: -1 })
    .limit(5)
    .lean()

  // Get overall uptime (average across all components)
  const uptimePromises = components.map((c) => calculateUptime(c, 30))
  const uptimeResults = await Promise.all(uptimePromises)
  const averageUptime =
    uptimeResults.reduce((sum, r) => sum + r.percentage, 0) / uptimeResults.length

  return {
    componentStatuses,
    activeIncidents,
    upcomingMaintenance,
    subscriberCount,
    recentIncidents: recentIncidents.map((i) => ({
      ...i,
      _id: i._id.toString(),
    })),
    averageUptime,
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  const healthyCount = stats.componentStatuses.filter(
    (c) => c.status === StatusLevel.OPERATIONAL
  ).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage incidents, maintenance, and monitor system health
          </p>
        </div>
        <Link href="/admin/incidents">
          <Button>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Create Incident
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthyCount}/{stats.componentStatuses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Components operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeIncidents === 0 ? 'No active incidents' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled or in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriberCount}</div>
            <p className="text-xs text-muted-foreground">
              Email subscribers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 30-day Uptime */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Uptime: {stats.averageUptime.toFixed(2)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.componentStatuses.map((c) => (
              <div key={c.component} className="flex items-center justify-between">
                <span className="text-sm">{componentLabels[c.component]}</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      c.status === StatusLevel.OPERATIONAL
                        ? 'operational'
                        : c.status === StatusLevel.DEGRADED
                        ? 'degraded'
                        : c.status === StatusLevel.PARTIAL_OUTAGE
                        ? 'partial'
                        : 'major'
                    }
                  >
                    {statusLabels[c.status]}
                  </Badge>
                  {c.responseTime > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {c.responseTime}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Incidents</CardTitle>
          <Link href="/admin/incidents">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent incidents</p>
          ) : (
            <div className="space-y-4">
              {stats.recentIncidents.map((incident) => (
                <div
                  key={incident._id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="h-5 w-5 text-status-operational" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-status-major" />
                    )}
                    <div>
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(incident.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      incident.status === 'resolved'
                        ? 'operational'
                        : incident.severity === 'critical'
                        ? 'major'
                        : incident.severity === 'major'
                        ? 'partial'
                        : 'degraded'
                    }
                  >
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
