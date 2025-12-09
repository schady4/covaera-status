import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Subscriber } from '@/lib/database/models'
import { sendVerificationEmail } from '@/lib/services/notification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, components } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Check if subscriber already exists
    const existing = await Subscriber.findOne({ email: email.toLowerCase() })

    if (existing) {
      if (existing.verified) {
        return NextResponse.json({
          message: 'You are already subscribed to status updates.',
        })
      } else {
        // Resend verification email
        await sendVerificationEmail(email, existing.verificationToken!)
        return NextResponse.json({
          message: 'Verification email resent. Please check your inbox.',
        })
      }
    }

    // Create new subscriber
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      components: components || [],
    })

    await subscriber.save()

    // Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      subscriber.verificationToken!
    )

    if (!emailSent) {
      // Email not configured, auto-verify for development
      if (process.env.NODE_ENV === 'development') {
        subscriber.verified = true
        subscriber.verifiedAt = new Date()
        subscriber.verificationToken = null
        await subscriber.save()
        return NextResponse.json({
          message: 'Subscribed successfully! (auto-verified in development)',
        })
      }
    }

    return NextResponse.json({
      message: 'Please check your email to verify your subscription.',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
