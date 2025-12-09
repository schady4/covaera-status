export const ComponentType = {
  API: 'api',
  DATABASE: 'database',
  CACHE: 'cache',
  AUTH: 'auth',
  PAYMENTS: 'payments',
  STORAGE: 'storage',
} as const

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType]

export const StatusLevel = {
  OPERATIONAL: 'operational',
  DEGRADED: 'degraded',
  PARTIAL_OUTAGE: 'partial_outage',
  MAJOR_OUTAGE: 'major_outage',
} as const

export type StatusLevel = (typeof StatusLevel)[keyof typeof StatusLevel]

export const IncidentStatus = {
  INVESTIGATING: 'investigating',
  IDENTIFIED: 'identified',
  MONITORING: 'monitoring',
  RESOLVED: 'resolved',
} as const

export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus]

export const IncidentSeverity = {
  MINOR: 'minor',
  MAJOR: 'major',
  CRITICAL: 'critical',
} as const

export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity]

export const MaintenanceStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus]

// Display labels
export const componentLabels: Record<ComponentType, string> = {
  api: 'API',
  database: 'Database',
  cache: 'Cache',
  auth: 'Authentication',
  payments: 'Payments',
  storage: 'File Storage',
}

export const statusLabels: Record<StatusLevel, string> = {
  operational: 'Operational',
  degraded: 'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
}

export const statusColors: Record<StatusLevel, string> = {
  operational: 'bg-status-operational',
  degraded: 'bg-status-degraded',
  partial_outage: 'bg-status-partial',
  major_outage: 'bg-status-major',
}

export const statusTextColors: Record<StatusLevel, string> = {
  operational: 'text-status-operational',
  degraded: 'text-status-degraded',
  partial_outage: 'text-status-partial',
  major_outage: 'text-status-major',
}

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

export const severityLabels: Record<IncidentSeverity, string> = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
}

export const severityColors: Record<IncidentSeverity, string> = {
  minor: 'bg-status-degraded',
  major: 'bg-status-partial',
  critical: 'bg-status-major',
}

// Get overall status from component statuses
export function getOverallStatus(statuses: StatusLevel[]): StatusLevel {
  if (statuses.some((s) => s === StatusLevel.MAJOR_OUTAGE)) {
    return StatusLevel.MAJOR_OUTAGE
  }
  if (statuses.some((s) => s === StatusLevel.PARTIAL_OUTAGE)) {
    return StatusLevel.PARTIAL_OUTAGE
  }
  if (statuses.some((s) => s === StatusLevel.DEGRADED)) {
    return StatusLevel.DEGRADED
  }
  return StatusLevel.OPERATIONAL
}

// Get status message for overall status
export function getOverallStatusMessage(status: StatusLevel): string {
  switch (status) {
    case StatusLevel.OPERATIONAL:
      return 'All Systems Operational'
    case StatusLevel.DEGRADED:
      return 'Some Systems Degraded'
    case StatusLevel.PARTIAL_OUTAGE:
      return 'Partial System Outage'
    case StatusLevel.MAJOR_OUTAGE:
      return 'Major System Outage'
  }
}
