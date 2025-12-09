import { connectToDatabase } from '@/lib/database'
import { Subscriber } from '@/lib/database/models'
import { ComponentType, StatusLevel, componentLabels, statusLabels } from '@/lib/utils/status-levels'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'status@covaera.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://status.covaera.com'

interface StatusChange {
  component: ComponentType
  previousStatus: StatusLevel
  newStatus: StatusLevel
}

async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email to:', to)
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: 'Covaera Status' },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent },
        ],
      }),
    })

    if (!response.ok) {
      console.error('SendGrid error:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${SITE_URL}/api/subscribe/verify?token=${token}`

  const subject = 'Verify your Covaera Status subscription'

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4B342F;">Verify your email</h2>
      <p>Thank you for subscribing to Covaera Status updates!</p>
      <p>Please click the button below to verify your email address:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}"
           style="background-color: #4B342F; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy this link: ${verifyUrl}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        If you didn't subscribe to Covaera Status, you can safely ignore this email.
      </p>
    </div>
  `

  const textContent = `
Verify your email

Thank you for subscribing to Covaera Status updates!

Please click the link below to verify your email address:
${verifyUrl}

If you didn't subscribe to Covaera Status, you can safely ignore this email.
  `

  return sendEmail(email, subject, htmlContent, textContent)
}

export async function notifyStatusChange(changes: StatusChange[]): Promise<void> {
  if (changes.length === 0) return

  await connectToDatabase()

  // Get all verified subscribers
  const subscribers = await Subscriber.find({ verified: true }).lean()

  if (subscribers.length === 0) {
    console.log('No verified subscribers to notify')
    return
  }

  // Build notification content
  const subject = changes.length === 1
    ? `Covaera Status: ${componentLabels[changes[0].component]} is ${statusLabels[changes[0].newStatus]}`
    : `Covaera Status: Multiple component status changes`

  const changesHtml = changes
    .map(
      (c) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <strong>${componentLabels[c.component]}</strong>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${statusLabels[c.previousStatus]} → ${statusLabels[c.newStatus]}
        </td>
      </tr>
    `
    )
    .join('')

  const changesText = changes
    .map(
      (c) =>
        `${componentLabels[c.component]}: ${statusLabels[c.previousStatus]} → ${statusLabels[c.newStatus]}`
    )
    .join('\n')

  // Send to each subscriber
  for (const subscriber of subscribers) {
    // Filter changes based on subscriber's component preferences
    const relevantChanges =
      subscriber.components.length === 0
        ? changes // All components if no preferences
        : changes.filter((c) =>
            subscriber.components.includes(c.component)
          )

    if (relevantChanges.length === 0) continue

    const unsubscribeUrl = `${SITE_URL}/api/subscribe/unsubscribe?token=${subscriber.unsubscribeToken}`

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B342F;">Covaera Status Update</h2>
        <p>The following component status changes have been detected:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Component</th>
              <th style="padding: 8px; text-align: left;">Status Change</th>
            </tr>
          </thead>
          <tbody>
            ${changesHtml}
          </tbody>
        </table>
        <p>
          <a href="${SITE_URL}" style="color: #4B342F;">View full status page →</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a> from status updates
        </p>
      </div>
    `

    const textContent = `
Covaera Status Update

The following component status changes have been detected:

${changesText}

View full status page: ${SITE_URL}

---
To unsubscribe: ${unsubscribeUrl}
    `

    await sendEmail(subscriber.email, subject, htmlContent, textContent)
  }
}

export async function notifyIncident(
  title: string,
  severity: string,
  message: string,
  affectedComponents: ComponentType[]
): Promise<void> {
  await connectToDatabase()

  const subscribers = await Subscriber.find({ verified: true }).lean()

  if (subscribers.length === 0) return

  const subject = `Covaera Incident: ${title}`

  for (const subscriber of subscribers) {
    // Filter by component preferences
    if (
      subscriber.components.length > 0 &&
      !affectedComponents.some((c) => subscriber.components.includes(c))
    ) {
      continue
    }

    const unsubscribeUrl = `${SITE_URL}/api/subscribe/unsubscribe?token=${subscriber.unsubscribeToken}`

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DD4124;">Incident Report</h2>
        <h3>${title}</h3>
        <p><strong>Severity:</strong> ${severity}</p>
        <p><strong>Affected Components:</strong> ${affectedComponents.map((c) => componentLabels[c]).join(', ')}</p>
        <p>${message}</p>
        <p style="margin-top: 24px;">
          <a href="${SITE_URL}" style="color: #4B342F;">View status page for updates →</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
        </p>
      </div>
    `

    const textContent = `
Incident Report: ${title}

Severity: ${severity}
Affected Components: ${affectedComponents.map((c) => componentLabels[c]).join(', ')}

${message}

View status page for updates: ${SITE_URL}

---
To unsubscribe: ${unsubscribeUrl}
    `

    await sendEmail(subscriber.email, subject, htmlContent, textContent)
  }
}
