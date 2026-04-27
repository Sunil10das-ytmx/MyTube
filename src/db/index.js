import mongoose from 'mongoose';
import {DB_name} from '../constant.js';

const connectDB = async ()=>{
    try {
        const connecting = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`);
        console.log(` \n mongodb connect HOST:${connecting.connection.host}`);
    } catch (error) {
        console.log("ERROR fail fail ", error);
        process.exit(1);
    }
}

export default connectDB 