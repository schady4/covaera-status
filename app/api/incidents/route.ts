import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Incident } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'active', 'resolved', or null for all
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Build query
    const query: Record<string, unknown> = {}
    if (status === 'active') {
      query.status = { $ne: 'resolved' }
    } else if (status === 'resolved') {
      query.status = 'resolved'
    }

    // Get total count
    const total = await Incident.countDocuments(query)

    // Get incidents with pagination
    const incidents = await Incident.find(query)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      incidents: incidents.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Incidents API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}
