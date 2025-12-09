import { ComponentType, StatusLevel, componentLabels, statusLabels } from '@/lib/utils/status-levels'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

interface StatusChange {
  component: ComponentType
  previousStatus: StatusLevel
  newStatus: StatusLevel
}

const statusEmoji: Record<StatusLevel, string> = {
  operational: ':white_check_mark:',
  degraded: ':warning:',
  partial_outage: ':large_orange_diamond:',
  major_outage: ':red_circle:',
}

const discordStatusEmoji: Record<StatusLevel, string> = {
  operational: '✅',
  degraded: '⚠️',
  partial_outage: '🟠',
  major_outage: '🔴',
}

const statusColor: Record<StatusLevel, number> = {
  operational: 0x22c55e, // green
  degraded: 0xeab308, // yellow
  partial_outage: 0xf97316, // orange
  major_outage: 0xef4444, // red
}

export async function sendSlackNotification(changes: StatusChange[]): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.log('Slack webhook not configured')
    return false
  }

  try {
    // Determine overall severity
    const worstStatus = changes.reduce<StatusLevel>((worst, c) => {
      const order = [StatusLevel.OPERATIONAL, StatusLevel.DEGRADED, StatusLevel.PARTIAL_OUTAGE, StatusLevel.MAJOR_OUTAGE]
      return order.indexOf(c.newStatus) > order.indexOf(worst) ? c.newStatus : worst
    }, StatusLevel.OPERATIONAL)

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji[worstStatus]} Covaera Status Update`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: changes.map((c) => ({
          type: 'mrkdwn',
          text: `*${componentLabels[c.component]}*\n${statusEmoji[c.previousStatus]} → ${statusEmoji[c.newStatus]} ${statusLabels[c.newStatus]}`,
        })),
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${process.env.NEXT_PUBLIC_SITE_URL || 'https://status.covaera.com'}|View Status Page>`,
          },
        ],
      },
    ]

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })

    return response.ok
  } catch (error) {
    console.error('Slack webhook error:', error)
    return false
  }
}

export async function sendDiscordNotification(changes: StatusChange[]): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured')
    return false
  }

  try {
    // Determine overall severity for embed color
    const worstStatus = changes.reduce<StatusLevel>((worst, c) => {
      const order = [StatusLevel.OPERATIONAL, StatusLevel.DEGRADED, StatusLevel.PARTIAL_OUTAGE, StatusLevel.MAJOR_OUTAGE]
      return order.indexOf(c.newStatus) > order.indexOf(worst) ? c.newStatus : worst
    }, StatusLevel.OPERATIONAL)

    const embed = {
      title: `${discordStatusEmoji[worstStatus]} Covaera Status Update`,
      color: statusColor[worstStatus],
      fields: changes.map((c) => ({
        name: componentLabels[c.component],
        value: `${discordStatusEmoji[c.previousStatus]} → ${discordStatusEmoji[c.newStatus]} ${statusLabels[c.newStatus]}`,
        inline: true,
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Covaera Status',
      },
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    return response.ok
  } catch (error) {
    console.error('Discord webhook error:', error)
    return false
  }
}

export async function sendSlackIncidentNotification(
  title: string,
  severity: string,
  message: string,
  affectedComponents: ComponentType[]
): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) return false

  try {
    const severityEmoji = severity === 'critical' ? ':rotating_light:' : severity === 'major' ? ':warning:' : ':information_source:'

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji} Incident: ${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${severity.charAt(0).toUpperCase() + severity.slice(1)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Affected:*\n${affectedComponents.map((c) => componentLabels[c]).join(', ')}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${process.env.NEXT_PUBLIC_SITE_URL || 'https://status.covaera.com'}|View Status Page>`,
          },
        ],
      },
    ]

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })

    return response.ok
  } catch (error) {
    console.error('Slack incident notification error:', error)
    return false
  }
}

export async function sendDiscordIncidentNotification(
  title: string,
  severity: string,
  message: string,
  affectedComponents: ComponentType[]
): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) return false

  try {
    const severityEmoji = severity === 'critical' ? '🚨' : severity === 'major' ? '⚠️' : 'ℹ️'
    const color = severity === 'critical' ? 0xef4444 : severity === 'major' ? 0xf97316 : 0xeab308

    const embed = {
      title: `${severityEmoji} Incident: ${title}`,
      description: message,
      color,
      fields: [
        {
          name: 'Severity',
          value: severity.charAt(0).toUpperCase() + severity.slice(1),
          inline: true,
        },
        {
          name: 'Affected Components',
          value: affectedComponents.map((c) => componentLabels[c]).join(', '),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Covaera Status',
      },
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    return response.ok
  } catch (error) {
    console.error('Discord incident notification error:', error)
    return false
  }
}

export async function triggerAllWebhooks(changes: StatusChange[]): Promise<void> {
  if (changes.length === 0) return

  await Promise.all([
    sendSlackNotification(changes),
    sendDiscordNotification(changes),
  ])
}
