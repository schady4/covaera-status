import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Subscriber } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/subscribe?error=invalid_token', request.url)
      )
    }

    await connectToDatabase()

    const subscriber = await Subscriber.findOneAndDelete({
      unsubscribeToken: token,
    })

    if (!subscriber) {
      return NextResponse.redirect(
        new URL('/subscribe?error=not_found', request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/subscribe?status=unsubscribed', request.url)
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.redirect(
      new URL('/subscribe?error=server_error', request.url)
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const subscriber = await Subscriber.findOneAndDelete({
      unsubscribeToken: token,
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
