import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Incident } from '@/lib/database/models'
import { requireAdmin } from '@/lib/auth'
import {
  ComponentType,
  IncidentStatus,
  IncidentSeverity,
} from '@/lib/utils/status-levels'
import { notifyIncident } from '@/lib/services/notification'
import {
  sendSlackIncidentNotification,
  sendDiscordIncidentNotification,
} from '@/lib/services/webhook'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase()

    const incidents = await Incident.find({})
      .sort({ startedAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({
      incidents: incidents.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })),
    })
  } catch (error) {
    console.error('Admin incidents GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, severity, affectedComponents, message } = body

    // Validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!severity || !Object.values(IncidentSeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Valid severity is required' },
        { status: 400 }
      )
    }

    if (
      !affectedComponents ||
      !Array.isArray(affectedComponents) ||
      affectedComponents.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one affected component is required' },
        { status: 400 }
      )
    }

    // Validate components
    for (const comp of affectedComponents) {
      if (!Object.values(ComponentType).includes(comp)) {
        return NextResponse.json(
          { error: `Invalid component: ${comp}` },
          { status: 400 }
        )
      }
    }

    await connectToDatabase()

    const incident = new Incident({
      title,
      severity,
      affectedComponents,
      status: IncidentStatus.INVESTIGATING,
      updates: message
        ? [
            {
              status: IncidentStatus.INVESTIGATING,
              message,
              timestamp: new Date(),
            },
          ]
        : [],
      startedAt: new Date(),
      createdBy: admin.email,
    })

    await incident.save()

    // Send notifications (don't await)
    const notificationMessage = message || `We are investigating an issue with ${title}`
    Promise.all([
      notifyIncident(title, severity, notificationMessage, affectedComponents),
      sendSlackIncidentNotification(title, severity, notificationMessage, affectedComponents),
      sendDiscordIncidentNotification(title, severity, notificationMessage, affectedComponents),
    ]).catch((err) => console.error('Notification error:', err))

    return NextResponse.json({
      incident: {
        ...incident.toObject(),
        _id: incident._id.toString(),
      },
    })
  } catch (error) {
    console.error('Admin incidents POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}
