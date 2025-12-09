import { NextRequest, NextResponse } from 'next/server'
import {
  runHealthChecks,
  saveHealthCheckResults,
  detectStatusChange,
} from '@/lib/services/health-checker'
import { notifyStatusChange } from '@/lib/services/notification'
import { triggerAllWebhooks } from '@/lib/services/webhook'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds this header for cron jobs)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting health checks...')

    // Detect status changes before saving new results
    const results = await runHealthChecks()
    const changes = await detectStatusChange(results)

    // Save the new results
    await saveHealthCheckResults(results)

    console.log(`[Cron] Health checks completed. ${changes.length} status changes detected.`)

    // If there are status changes, send notifications
    if (changes.length > 0) {
      console.log('[Cron] Status changes detected:', changes)

      // Send notifications in parallel (don't await to avoid timeout)
      Promise.all([
        notifyStatusChange(changes),
        triggerAllWebhooks(changes),
      ]).catch((err) => {
        console.error('[Cron] Error sending notifications:', err)
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        component: r.component,
        status: r.status,
        responseTime: r.responseTime,
      })),
      changes: changes.length,
    })
  } catch (error) {
    console.error('[Cron] Health check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
