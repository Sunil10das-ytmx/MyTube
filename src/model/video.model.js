import mongoose ,{schema} from 'mongoose'
import mongooesAggreagtepaginate from 'mongooes-aggreagte-paginate-v2'


const videoSchema=new Schema(
    {
        videoFile:{
            type:String,   //cloudnariy
            reqired:true,
        },
        thumnail:{
            type:String,    //cloudnariy
            required:true,

        },
        title:{
            type:String,
            required:true,

        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number,   //cloudnariy
            required:true,

        },
        thumnail:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true

        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    }
    ,{timestamp:true})


    videoSchema.plugin(mongooesAggreagtepaginate)

export const Video = mongoose.model("video",videoSchema)