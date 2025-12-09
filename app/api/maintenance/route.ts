import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Maintenance } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'upcoming', 'active', 'completed', or null for all

    // Build query
    const query: Record<string, unknown> = {}
    const now = new Date()

    if (status === 'upcoming') {
      query.status = 'scheduled'
      query.scheduledStart = { $gt: now }
    } else if (status === 'active') {
      query.status = 'in_progress'
    } else if (status === 'completed') {
      query.status = 'completed'
    }

    const maintenance = await Maintenance.find(query)
      .sort({ scheduledStart: status === 'completed' ? -1 : 1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      maintenance: maintenance.map((m) => ({
        ...m,
        _id: m._id.toString(),
      })),
    })
  } catch (error) {
    console.error('Maintenance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance' },
      { status: 500 }
    )
  }
}
