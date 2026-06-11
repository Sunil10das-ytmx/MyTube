import mongoose ,{schema} from 'mongoose'
import mongooesAggreagtepaginate from 'mongooes-aggreagte-paginate-v2'

const commentSchema = new Schema(
    {
        content:{
            type:String,
            required:true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
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

export const comment = mongoose.model("Comment",commentSchema)