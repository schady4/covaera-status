'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComponentType,
  IncidentSeverity,
  IncidentStatus,
  componentLabels,
  severityLabels,
  incidentStatusLabels,
} from '@/lib/utils/status-levels'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface IncidentFormProps {
  incident?: {
    _id: string
    title: string
    severity: IncidentSeverity
    affectedComponents: ComponentType[]
    status: IncidentStatus
  }
}

export function IncidentForm({ incident }: IncidentFormProps) {
  const router = useRouter()
  const isEditing = !!incident

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: incident?.title || '',
    severity: incident?.severity || IncidentSeverity.MINOR,
    affectedComponents: incident?.affectedComponents || [],
    status: incident?.status || IncidentStatus.INVESTIGATING,
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEditing
        ? `/api/admin/incidents/${incident._id}`
        : '/api/admin/incidents'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save incident')
      }

      router.push('/admin/incidents')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleComponent = (component: ComponentType) => {
    setFormData((prev) => ({
      ...prev,
      affectedComponents: prev.affectedComponents.includes(component)
        ? prev.affectedComponents.filter((c) => c !== component)
        : [...prev.affectedComponents, component],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Update Incident' : 'Create Incident'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Brief description of the incident"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <div className="flex gap-2">
              {Object.values(IncidentSeverity).map((severity) => (
                <Button
                  key={severity}
                  type="button"
                  variant={formData.severity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, severity }))
                  }
                >
                  {severityLabels[severity]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Affected Components</Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ComponentType).map((component) => (
                <Button
                  key={component}
                  type="button"
                  variant={
                    formData.affectedComponents.includes(component)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => toggleComponent(component)}
                >
                  {componentLabels[component]}
                </Button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {Object.values(IncidentStatus).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={formData.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status }))
                    }
                  >
                    {incidentStatusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">
              {isEditing ? 'Update Message' : 'Initial Message'}
            </Label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder={
                isEditing
                  ? 'Add an update about this incident...'
                  : 'Describe what is happening...'
              }
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Incident' : 'Create Incident'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
