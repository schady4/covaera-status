import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { StatusCheck } from '@/lib/database/models'
import {
  ComponentType,
  StatusLevel,
  componentLabels,
  statusLabels,
} from '@/lib/utils/status-levels'
import {
  calculateUptime,
  getAverageResponseTime,
} from '@/lib/services/uptime-calculator'

export async function GET() {
  try {
    await connectToDatabase()

    const components = Object.values(ComponentType)

    const componentData = await Promise.all(
      components.map(async (component) => {
        // Get latest status
        const latest = await StatusCheck.findOne({ component })
          .sort({ timestamp: -1 })
          .lean()

        // Get uptime stats for different periods
        const [uptime24h, uptime7d, uptime30d, uptime90d] = await Promise.all([
          calculateUptime(component, 1),
          calculateUptime(component, 7),
          calculateUptime(component, 30),
          calculateUptime(component, 90),
        ])

        // Get average response time
        const avgResponseTime = await getAverageResponseTime(component, 24)

        return {
          component,
          name: componentLabels[component],
          status: latest
            ? (latest.status as StatusLevel)
            : StatusLevel.OPERATIONAL,
          statusLabel: latest
            ? statusLabels[latest.status as StatusLevel]
            : statusLabels[StatusLevel.OPERATIONAL],
          responseTime: latest?.responseTime || 0,
          avgResponseTime24h: avgResponseTime,
          uptime: {
            '24h': uptime24h.percentage,
            '7d': uptime7d.percentage,
            '30d': uptime30d.percentage,
            '90d': uptime90d.percentage,
          },
          lastChecked: latest?.timestamp || null,
        }
      })
    )

    return NextResponse.json({
      components: componentData,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Components API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    )
  }
}
