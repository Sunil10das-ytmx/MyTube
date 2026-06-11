import mongoose, { Schema } from 'mongoose'

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    }
  },
  {
    timestamps: true
  }
)

export const Subscription = mongoose.model('Subscription', subscriptionSchema) 