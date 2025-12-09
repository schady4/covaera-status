import mongoose, { Schema, Document, Model } from 'mongoose'
import { ComponentType, MaintenanceStatus } from '@/lib/utils/status-levels'

export interface IMaintenance extends Document {
  title: string
  description: string
  affectedComponents: ComponentType[]
  scheduledStart: Date
  scheduledEnd: Date
  status: MaintenanceStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedComponents: [
      {
        type: String,
        enum: Object.values(ComponentType),
      },
    ],
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(MaintenanceStatus),
      default: MaintenanceStatus.SCHEDULED,
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

// Index for querying upcoming/active maintenance
MaintenanceSchema.index({ status: 1, scheduledStart: 1 })

// Index for listing maintenance windows
MaintenanceSchema.index({ scheduledStart: -1 })

export const Maintenance: Model<IMaintenance> =
  mongoose.models.Maintenance || mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema)
