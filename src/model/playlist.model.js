import mongoose, { Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    video: [
      {
        type: Schema.Types.ObjectId,
        ref: 'video'
      }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    }
  },
  {
    timestamps: true
  }
)

playlistSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model('Playlist', playlistSchema)