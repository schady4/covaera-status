import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Maintenance } from '@/lib/database/models'
import { requireAdmin } from '@/lib/auth'
import { ComponentType, MaintenanceStatus } from '@/lib/utils/status-levels'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase()

    const maintenance = await Maintenance.find({})
      .sort({ scheduledStart: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({
      maintenance: maintenance.map((m) => ({
        ...m,
        _id: m._id.toString(),
      })),
    })
  } catch (error) {
    console.error('Admin maintenance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance' },
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
    const { title, description, affectedComponents, scheduledStart, scheduledEnd } = body

    // Validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
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

    if (!scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'Scheduled start and end times are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(scheduledStart)
    const endDate = new Date(scheduledEnd)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const maintenance = new Maintenance({
      title,
      description,
      affectedComponents,
      scheduledStart: startDate,
      scheduledEnd: endDate,
      status: MaintenanceStatus.SCHEDULED,
      createdBy: admin.email,
    })

    await maintenance.save()

    return NextResponse.json({
      maintenance: {
        ...maintenance.toObject(),
        _id: maintenance._id.toString(),
      },
    })
  } catch (error) {
    console.error('Admin maintenance POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!status || !Object.values(MaintenanceStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const maintenance = await Maintenance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Maintenance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...maintenance,
      _id: maintenance._id.toString(),
    })
  } catch (error) {
    console.error('Admin maintenance PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await connectToDatabase()

    const maintenance = await Maintenance.findByIdAndDelete(id)

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Maintenance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin maintenance DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance' },
      { status: 500 }
    )
  }
}
