import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { StatusCheck, Incident, Maintenance } from '@/lib/database/models'
import {
  ComponentType,
  StatusLevel,
  getOverallStatus,
  componentLabels,
  statusLabels,
} from '@/lib/utils/status-levels'
import { calculateUptime } from '@/lib/services/uptime-calculator'

export async function GET() {
  try {
    await connectToDatabase()

    const components = Object.values(ComponentType)
    const componentStatuses: Array<{
      component: ComponentType
      name: string
      status: StatusLevel
      statusLabel: string
      responseTime: number
      updatedAt: Date | null
    }> = []

    // Get latest status for each component
    for (const component of components) {
      const latest = await StatusCheck.findOne({ component })
        .sort({ timestamp: -1 })
        .lean()

      if (latest) {
        componentStatuses.push({
          component: latest.component as ComponentType,
          name: componentLabels[latest.component as ComponentType],
          status: latest.status as StatusLevel,
          statusLabel: statusLabels[latest.status as StatusLevel],
          responseTime: latest.responseTime,
          updatedAt: latest.timestamp,
        })
      } else {
        componentStatuses.push({
          component,
          name: componentLabels[component],
          status: StatusLevel.OPERATIONAL,
          statusLabel: statusLabels[StatusLevel.OPERATIONAL],
          responseTime: 0,
          updatedAt: null,
        })
      }
    }

    // Calculate overall status
    const overallStatus = getOverallStatus(
      componentStatuses.map((c) => c.status)
    )

    // Get uptime percentages
    const uptimePromises = components.map(async (component) => {
      const stats = await calculateUptime(component, 30)
      return { component, uptime30d: stats.percentage }
    })
    const uptimeData = await Promise.all(uptimePromises)
    const uptimeMap = Object.fromEntries(
      uptimeData.map((u) => [u.component, u.uptime30d])
    )

    // Get active incidents
    const activeIncidents = await Incident.find({
      status: { $ne: 'resolved' },
    })
      .sort({ startedAt: -1 })
      .lean()

    // Get upcoming maintenance
    const upcomingMaintenance = await Maintenance.find({
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledEnd: { $gte: new Date() },
    })
      .sort({ scheduledStart: 1 })
      .lean()

    return NextResponse.json({
      status: overallStatus,
      statusLabel: statusLabels[overallStatus],
      components: componentStatuses.map((c) => ({
        ...c,
        uptime30d: uptimeMap[c.component] || 100,
      })),
      activeIncidents: activeIncidents.length,
      upcomingMaintenance: upcomingMaintenance.length,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Status API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
