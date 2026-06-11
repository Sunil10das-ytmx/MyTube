import mongoose ,{schema} from 'mongoose'

const playlistSchema = new Schema(
    {
        name:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        video:[
            {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
    timestamps:true
    }
    
)
commentSchema.plugin(mongooesAggreagtepaginate)

export const playlist = mongoose.model("Playlist",playlistSchema)