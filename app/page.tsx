import { Suspense } from 'react'
import { StatusOverview } from '@/components/status/StatusOverview'
import { ComponentStatusGrid } from '@/components/status/ComponentStatus'
import { UptimeChartList } from '@/components/status/UptimeChart'
import { IncidentTimeline } from '@/components/status/IncidentTimeline'
import { MaintenanceBanner } from '@/components/status/MaintenanceBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { connectToDatabase } from '@/lib/database'
import { StatusCheck, Incident, Maintenance } from '@/lib/database/models'
import { ComponentType, StatusLevel } from '@/lib/utils/status-levels'
import { getDailyUptimeHistory, calculateUptime } from '@/lib/services/uptime-calculator'

async function getStatusData() {
  try {
    await connectToDatabase()

    // Get latest status for each component
    const components = Object.values(ComponentType)
    const componentStatuses: Array<{
      component: ComponentType
      status: StatusLevel
      responseTime: number
    }> = []

    let lastChecked: Date | null = null

    for (const component of components) {
      const latest = await StatusCheck.findOne({ component })
        .sort({ timestamp: -1 })
        .lean()

      if (latest) {
        componentStatuses.push({
          component: latest.component as ComponentType,
          status: latest.status as StatusLevel,
          responseTime: latest.responseTime,
        })
        if (!lastChecked || latest.timestamp > lastChecked) {
          lastChecked = latest.timestamp
        }
      } else {
        // No data, assume operational
        componentStatuses.push({
          component,
          status: StatusLevel.OPERATIONAL,
          responseTime: 0,
        })
      }
    }

    // Get uptime data for charts
    const uptimeData = await Promise.all(
      components.map(async (component) => {
        const dailyData = await getDailyUptimeHistory(component, 90)
        const stats = await calculateUptime(component, 90)
        return {
          component,
          dailyData,
          uptimePercentage: stats.percentage,
        }
      })
    )

    // Get active/recent incidents
    const incidents = await Incident.find({})
      .sort({ startedAt: -1 })
      .limit(20)
      .lean()

    // Get upcoming/active maintenance
    const maintenance = await Maintenance.find({
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledEnd: { $gte: new Date() },
    })
      .sort({ scheduledStart: 1 })
      .lean()

    return {
      componentStatuses,
      lastChecked,
      uptimeData,
      incidents: incidents.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })),
      maintenance: maintenance.map((m) => ({
        ...m,
        _id: m._id.toString(),
      })),
    }
  } catch (error) {
    console.error('Error fetching status data:', error)
    // Return default data if database fails
    return {
      componentStatuses: Object.values(ComponentType).map((component) => ({
        component,
        status: StatusLevel.OPERATIONAL,
        responseTime: 0,
      })),
      lastChecked: null,
      uptimeData: [],
      incidents: [],
      maintenance: [],
    }
  }
}

function StatusSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default async function StatusPage() {
  const data = await getStatusData()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">System Status</h1>
        <p className="text-muted-foreground">
          Current status and uptime for Covaera services
        </p>
      </div>

      {/* Maintenance Banner */}
      <MaintenanceBanner maintenance={data.maintenance as any[]} />

      {/* Overall Status */}
      <Suspense fallback={<StatusSkeleton />}>
        <StatusOverview
          componentStatuses={data.componentStatuses.map((c) => c.status)}
          lastChecked={data.lastChecked}
        />
      </Suspense>

      {/* Component Status Grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Current Status</h2>
        <ComponentStatusGrid components={data.componentStatuses} />
      </section>

      {/* Uptime Charts */}
      {data.uptimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uptime (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UptimeChartList components={data.uptimeData as any[]} />
          </CardContent>
        </Card>
      )}

      {/* Incident Timeline */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Past Incidents</h2>
        <IncidentTimeline incidents={data.incidents as any[]} daysToShow={7} />
      </section>
    </div>
  )
}

// Dynamic rendering - requires database connection
export const dynamic = 'force-dynamic'
