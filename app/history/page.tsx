import { connectToDatabase } from '@/lib/database'
import { Incident } from '@/lib/database/models'
import { IncidentTimeline } from '@/components/status/IncidentTimeline'

async function getIncidentHistory() {
  await connectToDatabase()

  const incidents = await Incident.find({})
    .sort({ startedAt: -1 })
    .limit(100)
    .lean()

  return incidents.map((i) => ({
    ...i,
    _id: i._id.toString(),
  }))
}

export default async function HistoryPage() {
  const incidents = await getIncidentHistory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incident History</h1>
        <p className="text-muted-foreground">
          Past incidents and their resolutions
        </p>
      </div>

      <IncidentTimeline incidents={incidents as any[]} daysToShow={90} />
    </div>
  )
}

export const dynamic = 'force-dynamic'
