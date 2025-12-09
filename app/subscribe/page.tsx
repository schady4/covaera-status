'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscribeForm } from '@/components/status/SubscribeForm'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

function SubscribeContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const error = searchParams.get('error')

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Status Notifications</h1>
        <p className="text-muted-foreground">
          Get notified about Covaera system status changes
        </p>
      </div>

      {status === 'verified' && (
        <Card className="border-status-operational bg-status-operational/10">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-status-operational" />
            <div>
              <p className="font-medium">Email Verified!</p>
              <p className="text-sm text-muted-foreground">
                You will now receive status updates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'already_verified' && (
        <Card className="border-secondary bg-secondary/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-secondary" />
            <div>
              <p className="font-medium">Already Verified</p>
              <p className="text-sm text-muted-foreground">
                Your email is already subscribed to status updates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'unsubscribed' && (
        <Card className="border-muted">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Unsubscribed</p>
              <p className="text-sm text-muted-foreground">
                You have been removed from status notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm text-muted-foreground">
                {error === 'invalid_token'
                  ? 'Invalid or expired verification link.'
                  : error === 'not_found'
                  ? 'Subscription not found.'
                  : 'Something went wrong. Please try again.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!status && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Subscribe to Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email to receive notifications when there are status
              changes, incidents, or scheduled maintenance.
            </p>
            <SubscribeForm />
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        You can unsubscribe at any time using the link in any notification email.
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-md flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscribeContent />
    </Suspense>
  )
}
