import mongoose, { Schema, Document, Model } from 'mongoose'
import { ComponentType } from '@/lib/utils/status-levels'
import crypto from 'crypto'

export interface ISubscriber extends Document {
  email: string
  verified: boolean
  verificationToken: string | null
  unsubscribeToken: string
  components: ComponentType[] // Empty array = all components
  createdAt: Date
  verifiedAt: Date | null
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    unsubscribeToken: {
      type: String,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    components: [
      {
        type: String,
        enum: Object.values(ComponentType),
      },
    ],
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Index for email lookups
SubscriberSchema.index({ email: 1 }, { unique: true })

// Index for token verification
SubscriberSchema.index({ verificationToken: 1 })
SubscriberSchema.index({ unsubscribeToken: 1 })

// Index for finding verified subscribers
SubscriberSchema.index({ verified: 1 })

export const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema)
