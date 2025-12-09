import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { connectToDatabase } from '@/lib/database'
import { Subscriber } from '@/lib/database/models'
import { CheckCircle, XCircle } from 'lucide-react'

async function getSettings() {
  await connectToDatabase()

  const subscriberCount = await Subscriber.countDocuments({ verified: true })
  const pendingCount = await Subscriber.countDocuments({ verified: false })

  return {
    subscriberCount,
    pendingCount,
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
    discordConfigured: !!process.env.DISCORD_WEBHOOK_URL,
    mainPlatformUrl: process.env.MAIN_PLATFORM_URL || 'Not configured',
    cronSecret: !!process.env.CRON_SECRET,
  }
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configuration and integration settings
        </p>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Status of external service integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SendGrid Email</p>
              <p className="text-sm text-muted-foreground">
                Email notifications to subscribers
              </p>
            </div>
            {settings.sendgridConfigured ? (
              <Badge variant="operational" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Slack Webhook</p>
              <p className="text-sm text-muted-foreground">
                Status updates to Slack channel
              </p>
            </div>
            {settings.slackConfigured ? (
              <Badge variant="operational" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Discord Webhook</p>
              <p className="text-sm text-muted-foreground">
                Status updates to Discord channel
              </p>
            </div>
            {settings.discordConfigured ? (
              <Badge variant="operational" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>
            Health check and monitoring configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Main Platform URL</p>
              <p className="text-sm text-muted-foreground">
                The platform being monitored
              </p>
            </div>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {settings.mainPlatformUrl}
            </code>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cron Secret</p>
              <p className="text-sm text-muted-foreground">
                Protects cron endpoint from unauthorized access
              </p>
            </div>
            {settings.cronSecret ? (
              <Badge variant="operational" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="degraded" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Set
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscriber Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>
            Email notification subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-3xl font-bold">{settings.subscriberCount}</p>
              <p className="text-sm text-muted-foreground">
                Verified subscribers
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-3xl font-bold">{settings.pendingCount}</p>
              <p className="text-sm text-muted-foreground">
                Pending verification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
          <CardDescription>
            Required environment variables for full functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="rounded bg-muted p-3 font-mono text-xs">
              <p># Required</p>
              <p>STATUS_MONGODB_URI=mongodb+srv://...</p>
              <p>MAIN_PLATFORM_URL=https://covaera.com</p>
              <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...</p>
              <p>CLERK_SECRET_KEY=sk_...</p>
              <p>ADMIN_EMAILS=admin@covaera.com</p>
              <p className="mt-2"># Optional</p>
              <p>SENDGRID_API_KEY=SG....</p>
              <p>SLACK_WEBHOOK_URL=https://hooks.slack.com/...</p>
              <p>DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...</p>
              <p>CRON_SECRET=your-secret</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
