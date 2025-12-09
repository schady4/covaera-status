# Covaera Status

Status page for monitoring Covaera platform health and uptime.

## Development

```bash
npm install
npm run dev -- -p 3002
```

Runs on `http://localhost:3002` (main app runs on 3000).

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `STATUS_MONGODB_URI` - MongoDB connection string
- `MAIN_PLATFORM_URL` - URL of main Covaera platform to monitor
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Shared Clerk key
- `CLERK_SECRET_KEY` - Shared Clerk secret
- `SENDGRID_API_KEY` - For email notifications
- `ADMIN_EMAILS` - Comma-separated admin email addresses

## Features

- Real-time component status monitoring
- 90-day uptime history
- Incident management
- Scheduled maintenance windows
- Email notifications for subscribers
- Slack/Discord webhook integrations

## Monitored Components

- API
- Database
- Cache
- Authentication
- Payments
- File Storage

## Architecture

- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB (separate from main platform)
- **Auth:** Shared Clerk authentication
- **Styling:** Tailwind CSS + shadcn/ui
- **Monitoring:** Vercel Cron Jobs (1-minute intervals)
