import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { ComponentType } from '@/lib/utils/status-levels'
import { getDailyUptimeHistory } from '@/lib/services/uptime-calculator'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const component = searchParams.get('component') as ComponentType | null
    const days = parseInt(searchParams.get('days') || '90', 10)

    // Validate days parameter
    const validDays = Math.min(Math.max(days, 1), 90)

    if (component && !Object.values(ComponentType).includes(component)) {
      return NextResponse.json(
        { error: 'Invalid component' },
        { status: 400 }
      )
    }

    const components = component
      ? [component]
      : Object.values(ComponentType)

    const historyData = await Promise.all(
      components.map(async (comp) => {
        const dailyData = await getDailyUptimeHistory(comp, validDays)
        return {
          component: comp,
          history: dailyData,
        }
      })
    )

    return NextResponse.json({
      days: validDays,
      history: historyData,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
