import mongoose from 'mongoose';
import {asyncHandler} from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from '../model/user.model.js';
import {uploadData} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';


// !Generate AccessToken And RefreshToken
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(404, "User not found")
    }

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "internal server problem")
  }
}

// ! Register user
const registerUser = asyncHandler(async (req, res) =>
    {
    const { fullname, email, username, password } = req.body

    if([fullname, email, username, password].some((field) => field?.trim() === "")){
      throw new ApiError(400, "All fields are required")
    }

    //^ check if user already exist:username and email
    
    const existedUser = await User.findOne({
  $or: [{ username }, { email }]
})
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarFile = req.files?.find(file => file.fieldname?.toLowerCase() === 'avatar');
    const coverImageFile = req.files?.find(file => file.fieldname?.toLowerCase() === 'coverimage');

    const avatarLocalpath = avatarFile?.path;
    const coverImageLocalpath = coverImageFile?.path;

    if(!avatarLocalpath){
      throw new ApiError(400, "Avatar is needed")
    }

    const avatar = await uploadData(avatarLocalpath)
    const coverImage = coverImageLocalpath ? await uploadData(coverImageLocalpath) : null

    if(!avatar?.url){
      throw new ApiError(400, "Avatar is needed")
    }

    const user = await User.create({
      fullname: normalizedFullname,
      avatar: avatar.url,
      coverimage: coverImage?.url || "",
      email: normalizedEmail,
      password: normalizedPassword,
      username: normalizedUsername
    })

      const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
      )

    // ^ check for user creation
    if(!createduser){
        throw new ApiError(500,"something went wrong while registering the user")
      }

    return res.status(201).json(
      new ApiResponse(201, createduser, "User registered successfully")
    )

})

// ! Login user
const logInUser = asyncHandler(async(req,res)=>{
  const {email, username, password}= req.body

  if(!password){
    throw new ApiError(400, "Password is required")
  }

  if(!(username || email)){
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or:[
      { email },
      { username }
    ]
  })

  if(!user){
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "Password invalid")
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    )
})

// !log out user
const logOutUser = asyncHandler(async (req, res) => {
  // ^remove cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken:1  //this removes the field from document
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }
  return res
    .status(200)
    .cookie("accessToken", "", options)
    .cookie("refreshToken", "", options)
    .json(
      new ApiResponse(200, {}, "user logged out")
    )

     
})


// !refreshing the assecc token
 const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshtoken) {
       throw new ApiError(401,"unauthorized request")
    }

    try {
      const decodedToken = jwt.verify(incomingRefreshtoken,process.env.REFRESH_TOKEN_SECRET)
       
      const user = await User.findById(decodedToken?._id)
  
      if (!user) {
        throw new ApiError(401,"Invalid refresh Token")
      }
  
      if(incomingRefreshtoken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is used or expired")
      }
  
      const options={
        httpOnly:true,
        secure:true
      }
  
      const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
  
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              accessToken,
              refreshToken
            },
            "Access token refreshed"
          )
        )
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
    }

 })


//  !passwordChange
  const passwordChange = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

   if(!oldPassword || !newPassword){
     throw new ApiError(400, "Old password and new password are required")
   }

   const user = await User.findById(req.user?._id)
   if (!user) {
     throw new ApiError(404, "User not found")
   }

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiResponse(200, {}, "Password has Changed Successfully"))
    
  })

// !find user
const findUser = asyncHandler(async(req,res)=>{
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "User fetched successfully")
    )
})

// !update details
const updateDetails = asyncHandler(async(req, res)=>{
  const {fullname, email } = req.body

  if(!email || !fullname){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {new:true}
  ).select("-password")

  if(!user){
    throw new ApiError(404, "User not found")
  }

  return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated"))
})


// !Avatar image update
const updateAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadData(avatarLocalPath)

   if (!avatar?.url) {
      throw new ApiError(400,"Error while uploading avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          avatar:avatar.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    if(!user){
      throw new ApiError(404, "User not found")
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Avatar updated successfully")
      )
})

// !Cover image update
const updatecoverimage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
      throw new ApiError(400,"Cover image file is missing")
   }

   const coverImage = await uploadData(coverImageLocalPath)

   if (!coverImage?.url) {
      throw new ApiError(400,"Error while uploading cover image")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          coverimage:coverImage.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    if(!user){
      throw new ApiError(404, "User not found")
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Cover image updated successfully")
      )
})

// !getUserChannelProfile
const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params

   if(!username?.trim()){
    throw new ApiError(400,"Username is missing")
   }

   const channel = await User.aggregate([
    {
      $match:{
        username: username.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"Subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"SubscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$Subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$SubscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[mongoose.Types.ObjectId(req.user?._id), "$Subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverimage:1,
        email:1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
  )



})

// !getWatchHistory
const getWatchHistory= asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user?.[0]?.watchHistory || [],
        "Watch history fetched successfully"
      )
    )
})



export {
  registerUser,
  logInUser, 
  logOutUser, 
  refreshAccessToken, 
  passwordChange, 
  findUser, 
  updateDetails,
  updateAvatar,
  updatecoverimage ,
  getUserChannelProfile,
  getWatchHistory

} 