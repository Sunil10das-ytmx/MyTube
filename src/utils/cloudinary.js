import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_CLOUD_KEY, 
        api_secret: process.env.CLOUDINARY_CLOUD_SECRET 
    });

const uploadData = async(filePath)=>{
    try {
        if(!filePath) return null;
        const response = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto"
        })
        fs.unlinkSync(filePath)
        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        fs.unlinkSync(filePath)  //removed the temp file saved in local server as the upload got failed
        return null
    }
}


export {uploadData}