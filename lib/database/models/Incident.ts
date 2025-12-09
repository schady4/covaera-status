import mongoose, { Schema, Document, Model } from 'mongoose'
import { ComponentType, IncidentStatus, IncidentSeverity } from '@/lib/utils/status-levels'

export interface IIncidentUpdate {
  status: IncidentStatus
  message: string
  timestamp: Date
}

export interface IIncident extends Document {
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  affectedComponents: ComponentType[]
  updates: IIncidentUpdate[]
  startedAt: Date
  resolvedAt: Date | null
  postmortem: string | null
  createdBy: string // User ID or email
  createdAt: Date
  updatedAt: Date
}

const IncidentUpdateSchema = new Schema<IIncidentUpdate>(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(IncidentStatus),
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
)

const IncidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.INVESTIGATING,
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(IncidentSeverity),
    },
    affectedComponents: [
      {
        type: String,
        enum: Object.values(ComponentType),
      },
    ],
    updates: {
      type: [IncidentUpdateSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    postmortem: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for querying active incidents
IncidentSchema.index({ status: 1, startedAt: -1 })

// Index for listing recent incidents
IncidentSchema.index({ startedAt: -1 })

export const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema)
