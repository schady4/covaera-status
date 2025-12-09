import { connectToDatabase } from '@/lib/database'
import { StatusCheck } from '@/lib/database/models'
import { ComponentType, StatusLevel } from '@/lib/utils/status-levels'
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns'

interface UptimeStats {
  percentage: number
  totalChecks: number
  operationalChecks: number
  degradedChecks: number
  outageChecks: number
}

interface DailyUptime {
  date: string
  status: StatusLevel
  uptimePercentage: number
}

export async function calculateUptime(
  component: ComponentType,
  days: number
): Promise<UptimeStats> {
  await connectToDatabase()

  const startDate = subDays(new Date(), days)

  const checks = await StatusCheck.find({
    component,
    timestamp: { $gte: startDate },
  }).lean()

  if (checks.length === 0) {
    return {
      percentage: 100,
      totalChecks: 0,
      operationalChecks: 0,
      degradedChecks: 0,
      outageChecks: 0,
    }
  }

  const totalChecks = checks.length
  const operationalChecks = checks.filter(
    (c) => c.status === StatusLevel.OPERATIONAL
  ).length
  const degradedChecks = checks.filter(
    (c) => c.status === StatusLevel.DEGRADED
  ).length
  const outageChecks = checks.filter(
    (c) =>
      c.status === StatusLevel.PARTIAL_OUTAGE ||
      c.status === StatusLevel.MAJOR_OUTAGE
  ).length

  // Calculate percentage (operational + degraded count as "up", outages count as "down")
  const upChecks = operationalChecks + degradedChecks
  const percentage = (upChecks / totalChecks) * 100

  return {
    percentage: Math.round(percentage * 100) / 100,
    totalChecks,
    operationalChecks,
    degradedChecks,
    outageChecks,
  }
}

export async function getUptimeForAllComponents(
  days: number
): Promise<Map<ComponentType, UptimeStats>> {
  const components = Object.values(ComponentType)
  const uptimeMap = new Map<ComponentType, UptimeStats>()

  await Promise.all(
    components.map(async (component) => {
      const stats = await calculateUptime(component, days)
      uptimeMap.set(component, stats)
    })
  )

  return uptimeMap
}

export async function getDailyUptimeHistory(
  component: ComponentType,
  days: number = 90
): Promise<DailyUptime[]> {
  await connectToDatabase()

  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  const dailyData: DailyUptime[] = []

  // Generate all days in range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  for (const day of allDays) {
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    const checks = await StatusCheck.find({
      component,
      timestamp: { $gte: dayStart, $lte: dayEnd },
    }).lean()

    if (checks.length === 0) {
      // No data for this day - assume operational
      dailyData.push({
        date: format(day, 'yyyy-MM-dd'),
        status: StatusLevel.OPERATIONAL,
        uptimePercentage: 100,
      })
      continue
    }

    // Calculate worst status for the day
    let worstStatus: StatusLevel = StatusLevel.OPERATIONAL
    for (const check of checks) {
      const checkStatus = check.status as StatusLevel
      if (
        checkStatus === StatusLevel.MAJOR_OUTAGE ||
        (checkStatus === StatusLevel.PARTIAL_OUTAGE &&
          worstStatus !== StatusLevel.MAJOR_OUTAGE) ||
        (checkStatus === StatusLevel.DEGRADED &&
          worstStatus === StatusLevel.OPERATIONAL)
      ) {
        worstStatus = checkStatus
      }
    }

    // Calculate uptime percentage for the day
    const upChecks = checks.filter(
      (c) =>
        c.status === StatusLevel.OPERATIONAL ||
        c.status === StatusLevel.DEGRADED
    ).length
    const uptimePercentage = (upChecks / checks.length) * 100

    dailyData.push({
      date: format(day, 'yyyy-MM-dd'),
      status: worstStatus,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    })
  }

  return dailyData
}

export async function getAverageResponseTime(
  component: ComponentType,
  days: number
): Promise<number> {
  await connectToDatabase()

  const startDate = subDays(new Date(), days)

  const result = await StatusCheck.aggregate([
    {
      $match: {
        component,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
      },
    },
  ])

  if (result.length === 0 || result[0].avgResponseTime === null) {
    return 0
  }

  return Math.round(result[0].avgResponseTime)
}

export async function getResponseTimeHistory(
  component: ComponentType,
  hours: number = 24
): Promise<{ timestamp: Date; responseTime: number }[]> {
  await connectToDatabase()

  const startDate = subDays(new Date(), hours / 24)

  const checks = await StatusCheck.find({
    component,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 })
    .select('timestamp responseTime')
    .lean()

  return checks.map((c) => ({
    timestamp: c.timestamp,
    responseTime: c.responseTime,
  }))
}
