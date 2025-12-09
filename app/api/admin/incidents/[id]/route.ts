import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Incident } from '@/lib/database/models'
import { requireAdmin } from '@/lib/auth'
import { IncidentStatus } from '@/lib/utils/status-levels'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase()
    const { id } = await params

    const incident = await Incident.findById(id).lean()

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...incident,
      _id: incident._id.toString(),
    })
  } catch (error) {
    console.error('Admin incident GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, message, postmortem } = body
    const { id } = await params

    await connectToDatabase()

    const incident = await Incident.findById(id)

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Update status and add update entry
    if (status && Object.values(IncidentStatus).includes(status)) {
      incident.status = status

      if (message) {
        incident.updates.push({
          status,
          message,
          timestamp: new Date(),
        })
      }

      // If resolved, set resolvedAt
      if (status === IncidentStatus.RESOLVED) {
        incident.resolvedAt = new Date()
      }
    }

    // Update postmortem
    if (postmortem !== undefined) {
      incident.postmortem = postmortem
    }

    await incident.save()

    return NextResponse.json({
      ...incident.toObject(),
      _id: incident._id.toString(),
    })
  } catch (error) {
    console.error('Admin incident PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase()
    const { id } = await params

    const incident = await Incident.findByIdAndDelete(id)

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin incident DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}
