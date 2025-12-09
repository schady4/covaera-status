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

    const subscriber = await Subscriber.findOne({ verificationToken: token })

    if (!subscriber) {
      return NextResponse.redirect(
        new URL('/subscribe?error=invalid_token', request.url)
      )
    }

    if (subscriber.verified) {
      return NextResponse.redirect(
        new URL('/subscribe?status=already_verified', request.url)
      )
    }

    // Verify the subscriber
    subscriber.verified = true
    subscriber.verifiedAt = new Date()
    subscriber.verificationToken = null
    await subscriber.save()

    return NextResponse.redirect(
      new URL('/subscribe?status=verified', request.url)
    )
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(
      new URL('/subscribe?error=server_error', request.url)
    )
  }
}
