import mongoose, { Schema, Document, Model } from 'mongoose'
import { ComponentType, StatusLevel } from '@/lib/utils/status-levels'

export interface IStatusCheck extends Document {
  timestamp: Date
  component: ComponentType
  status: StatusLevel
  responseTime: number // milliseconds
  statusCode: number
  details: Record<string, unknown>
  createdAt: Date
}

const StatusCheckSchema = new Schema<IStatusCheck>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    component: {
      type: String,
      required: true,
      enum: Object.values(ComponentType),
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(StatusLevel),
    },
    responseTime: {
      type: Number,
      required: true,
      default: 0,
    },
    statusCode: {
      type: Number,
      required: true,
      default: 200,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound index for efficient querying
StatusCheckSchema.index({ timestamp: -1, component: 1 })

// TTL index - auto-delete after 90 days
StatusCheckSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Prevent model recompilation in development
export const StatusCheck: Model<IStatusCheck> =
  mongoose.models.StatusCheck || mongoose.model<IStatusCheck>('StatusCheck', StatusCheckSchema)
