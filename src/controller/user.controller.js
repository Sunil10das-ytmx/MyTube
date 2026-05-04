 import {asyncHandler} from '../utils/asynchandler.js';
 import ApiError from '../utils/ApiError.js'; 
 import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from '../model/user.model.js';
import {uploadData} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) =>
    {
    //^ get user details from frontend
    const {fullname,email,username}=req.body
    console.log("email",email);
    console.log("username",username);


    //^ validation-not empty
    if([fullname,email,username,password].some((field)=>field?.trim() === "")){
         throw new ApiError(400,"All fileds all are required")
    }

    //^ check if user already exist:username and email
    
    const ExistedUser=username.findOne({
        $or:[{ username },{ email }]
    })
    if(ExistedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //^ chaeck for images,and avatar
    const avatarLocalpath = req.files?.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverimage[0]?.path;

    //^ upload to cloudinary,avatar 
    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is needed")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverImageLocalpath);

    if(!avatar){
        throw new ApiError(400,"Avatar is needed")
    }

    //^ create user object-create entry in db 
      const user = await User.create({
        fulName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowercase()
      })

      const createduser = await User.findById(user._id)
    
      
    //^ remove the encrypted password and refresh token filed from response 
    createduser = await User.findById(user._id).select(
        "-password -refershToken"
      )

    // ^ check for user creation
    if(!createdUser){
        throw new ApiError(500,"someting went wrong while registering the user")
      }

    // ^ return response
      return res.status(201).json(
        new ApiResponse(200, createduser, "User register successfully")
      )

})

export {registerUser}