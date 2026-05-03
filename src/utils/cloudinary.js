import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
        api_key: 'process.env.CLOUDINARY_CLOUD_KEY', 
        api_secret: 'process.env.CLOUDINARY_CLOUD_SECERT' 
    });

const uplaodData= async(fileapath)=>{
    try {
        if(!fileapath) return null;
        const response = awaitvcloudinary.uploader.upload(fileapath,{
            resourec_type="auto"
        })
        console.log(response.url)
    } catch (error) {
        fs.unlinkSync(fileapath)  //reomoved the temp file saved in local server as the upload got failed
        return null
    }
}


export {uplaodData}