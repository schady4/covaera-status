import { connectToDatabase } from '@/lib/database'
import { StatusCheck } from '@/lib/database/models'
import { ComponentType, StatusLevel } from '@/lib/utils/status-levels'

const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'https://covaera.com'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

interface HealthCheckResult {
  component: ComponentType
  status: StatusLevel
  responseTime: number
  statusCode: number
  details: Record<string, unknown>
}

// Timeout for health check requests (10 seconds)
const REQUEST_TIMEOUT = 10000

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response | null; duration: number; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  const start = Date.now()

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        ...(INTERNAL_API_KEY ? { 'X-Internal-API-Key': INTERNAL_API_KEY } : {}),
      },
    })
    const duration = Date.now() - start
    return { response, duration }
  } catch (error) {
    const duration = Date.now() - start
    return {
      response: null,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

function determineStatus(statusCode: number, responseTime: number): StatusLevel {
  // Major outage: 5xx errors or timeout
  if (statusCode >= 500 || statusCode === 0) {
    return StatusLevel.MAJOR_OUTAGE
  }

  // Partial outage: 4xx errors (excluding 404 which might be acceptable)
  if (statusCode >= 400 && statusCode !== 404) {
    return StatusLevel.PARTIAL_OUTAGE
  }

  // Degraded: Slow response time (> 2 seconds)
  if (responseTime > 2000) {
    return StatusLevel.DEGRADED
  }

  // Operational
  return StatusLevel.OPERATIONAL
}

async function checkApi(): Promise<HealthCheckResult> {
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}/api/health`)

  if (!response) {
    return {
      component: ComponentType.API,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  let details: Record<string, unknown> = {}
  try {
    details = await response.json()
  } catch {
    // Response not JSON, that's okay
  }

  return {
    component: ComponentType.API,
    status: determineStatus(response.status, duration),
    responseTime: duration,
    statusCode: response.status,
    details,
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}/api/health/ready`)

  if (!response) {
    return {
      component: ComponentType.DATABASE,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  let details: Record<string, unknown> = {}
  try {
    details = await response.json()
    // Check specific database status from response
    if (details.checks && typeof details.checks === 'object') {
      const dbCheck = (details.checks as Record<string, unknown>).database
      if (dbCheck && typeof dbCheck === 'object' && (dbCheck as Record<string, unknown>).connected === false) {
        return {
          component: ComponentType.DATABASE,
          status: StatusLevel.MAJOR_OUTAGE,
          responseTime: duration,
          statusCode: response.status,
          details,
        }
      }
    }
  } catch {
    // Response not JSON
  }

  return {
    component: ComponentType.DATABASE,
    status: determineStatus(response.status, duration),
    responseTime: duration,
    statusCode: response.status,
    details,
  }
}

async function checkCache(): Promise<HealthCheckResult> {
  // Note: /api/redis/health requires auth on main platform
  // We'll check via the main health endpoint's cache status
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}/api/health`)

  if (!response) {
    return {
      component: ComponentType.CACHE,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  let details: Record<string, unknown> = {}
  let cacheStatus: StatusLevel = StatusLevel.OPERATIONAL

  try {
    details = await response.json()
    // Check cache status from main health response
    if (details.checks && typeof details.checks === 'object') {
      const cacheCheck = (details.checks as Record<string, unknown>).cache
      if (cacheCheck && typeof cacheCheck === 'object') {
        const status = (cacheCheck as Record<string, unknown>).status
        if (status === 'unhealthy') {
          cacheStatus = StatusLevel.MAJOR_OUTAGE
        } else if (status === 'degraded') {
          cacheStatus = StatusLevel.DEGRADED
        }
      }
    }
  } catch {
    // Response not JSON
  }

  return {
    component: ComponentType.CACHE,
    status: cacheStatus,
    responseTime: duration,
    statusCode: response.status,
    details: { cache: (details.checks as Record<string, unknown>)?.cache || {} },
  }
}

async function checkAuth(): Promise<HealthCheckResult> {
  // Check if the sign-in page loads (basic auth system check)
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}/sign-in`, {
    method: 'HEAD',
  })

  if (!response) {
    return {
      component: ComponentType.AUTH,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  return {
    component: ComponentType.AUTH,
    status: determineStatus(response.status, duration),
    responseTime: duration,
    statusCode: response.status,
    details: {},
  }
}

async function checkPayments(): Promise<HealthCheckResult> {
  // Check if the main health endpoint reports Stripe connectivity
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}/api/health/system`)

  if (!response) {
    return {
      component: ComponentType.PAYMENTS,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  let details: Record<string, unknown> = {}

  try {
    details = await response.json()
    // Check if Stripe is configured (from environment info)
    const envCheck = details.environment as Record<string, unknown> | undefined
    if (envCheck && envCheck.stripeConfigured === false) {
      return {
        component: ComponentType.PAYMENTS,
        status: StatusLevel.PARTIAL_OUTAGE,
        responseTime: duration,
        statusCode: response.status,
        details: { stripeConfigured: false },
      }
    }
  } catch {
    // Response not JSON
  }

  return {
    component: ComponentType.PAYMENTS,
    status: determineStatus(response.status, duration),
    responseTime: duration,
    statusCode: response.status,
    details,
  }
}

async function checkStorage(): Promise<HealthCheckResult> {
  // Basic connectivity check - we'd ideally have a dedicated endpoint
  // For now, check if the main site loads (which uses UploadThing for images)
  const { response, duration, error } = await fetchWithTimeout(`${MAIN_PLATFORM_URL}`, {
    method: 'HEAD',
  })

  if (!response) {
    return {
      component: ComponentType.STORAGE,
      status: StatusLevel.MAJOR_OUTAGE,
      responseTime: duration,
      statusCode: 0,
      details: { error: error || 'Request failed' },
    }
  }

  return {
    component: ComponentType.STORAGE,
    status: determineStatus(response.status, duration),
    responseTime: duration,
    statusCode: response.status,
    details: {},
  }
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  // Run all checks in parallel
  const results = await Promise.all([
    checkApi(),
    checkDatabase(),
    checkCache(),
    checkAuth(),
    checkPayments(),
    checkStorage(),
  ])

  return results
}

export async function saveHealthCheckResults(results: HealthCheckResult[]): Promise<void> {
  await connectToDatabase()

  const timestamp = new Date()

  const documents = results.map((result) => ({
    timestamp,
    component: result.component,
    status: result.status,
    responseTime: result.responseTime,
    statusCode: result.statusCode,
    details: result.details,
  }))

  await StatusCheck.insertMany(documents)
}

export async function getLatestStatus(): Promise<Map<ComponentType, HealthCheckResult>> {
  await connectToDatabase()

  const components = Object.values(ComponentType)
  const statusMap = new Map<ComponentType, HealthCheckResult>()

  // Get latest check for each component
  for (const component of components) {
    const latest = await StatusCheck.findOne({ component }).sort({ timestamp: -1 }).lean()

    if (latest) {
      statusMap.set(component, {
        component: latest.component as ComponentType,
        status: latest.status as StatusLevel,
        responseTime: latest.responseTime,
        statusCode: latest.statusCode,
        details: latest.details as Record<string, unknown>,
      })
    } else {
      // No data yet, assume operational
      statusMap.set(component, {
        component,
        status: StatusLevel.OPERATIONAL,
        responseTime: 0,
        statusCode: 200,
        details: { message: 'No data available' },
      })
    }
  }

  return statusMap
}

export async function detectStatusChange(
  newResults: HealthCheckResult[]
): Promise<{ component: ComponentType; previousStatus: StatusLevel; newStatus: StatusLevel }[]> {
  const currentStatus = await getLatestStatus()
  const changes: { component: ComponentType; previousStatus: StatusLevel; newStatus: StatusLevel }[] = []

  for (const result of newResults) {
    const current = currentStatus.get(result.component)
    if (current && current.status !== result.status) {
      changes.push({
        component: result.component,
        previousStatus: current.status,
        newStatus: result.status,
      })
    }
  }

  return changes
}
