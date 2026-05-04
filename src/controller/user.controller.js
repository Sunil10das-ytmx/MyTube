import {asyncHandler} from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js'; 
import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from '../model/user.model.js';
import {uploadData} from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) =>
    {
    //^ get user details from frontend
    const {fullname,email,username,password}=req.body
    console.log("email",email);
    console.log("username",username);


    //^ validation-not empty
    if([fullname,email,username,password].some((field)=>field?.trim() === "")){
         throw new ApiError(400,"All fileds all are required")
    }

    //^ check if user already exist:username and email
    
    const existedUser = await User.findOne({
  $or: [{ username }, { email }]
})
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //^ check for images and avatar
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);
    const avatarFile = req.files?.find(file => file.fieldname?.toLowerCase() === 'avatar');
    const coverImageFile = req.files?.find(file => file.fieldname?.toLowerCase() === 'coverimage');

    const avatarLocalpath = avatarFile?.path;
    const coverImageLocalpath = coverImageFile?.path;

    //^ upload to cloudinary, avatar
    console.log("avatarLocalpath:", avatarLocalpath);
    console.log("coverImageLocalpath:", coverImageLocalpath);
    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is needed")
    }

    const avatar = await uploadData(avatarLocalpath);
    const coverImage = await uploadData(coverImageLocalpath);

    if(!avatar){
        throw new ApiError(400,"Avatar is needed")
    }

    //^ create user object-create entry in db & remove password and return token filed from
      const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
      })

      const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
      )

    // ^ check for user creation
    if(!createduser){
        throw new ApiError(500,"something went wrong while registering the user")
      }

    // ^ return response
      return res.status(201).json(
        new ApiResponse(200, createduser, "User register successfully")
      )

})

export {registerUser}