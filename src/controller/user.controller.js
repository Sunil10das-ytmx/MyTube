import {asyncHandler} from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js'; 
import { ApiResponse } from '../utils/ApiResponse.js';
import {User} from '../model/user.model.js';
import {uploadData} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';


// !Generate AccessToken And RefershToken
const generateAccessTokenAndRefershToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(404, "User not found")
    }

    const AccessToken = await user.generateAccessToken()
    const RefreshToken = await user.generateRefreshToken()

    user.refreshToken = RefreshToken
    await user.save({ validateBeforeSave: false })

    return { AccessToken, RefreshToken }
  } catch (error) {
    throw new ApiError(500, "internal server problem")
  }
}

// ! Register user
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

// ! Login user
const logInUser = asyncHandler(async(req,res)=>{
  // ^ req body -> data  
const {email, username, password}= req.body

if(!(username || email)){
  throw new ApiError(400,"username or email is required")
}

// ^ user or email 
   const user = await User.findOne({
    $or:[{email},{password}]
   })

   // ^ find the user
   if(!user){
    throw new ApiError(404,"user not exist")
   }

// ^ password check 
  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401,"Password invalid")
   }

// ^ loged in using refreshToken by giving Access Token
  const {AccessToken, RefreshToken} = await generateAccessTokenAndRefershToken(user._id)

  
const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

// ^ send cookie 
 const options={
    httpOnly:true,
    secure:true
 }
 return res
 .status(200)
 .cookie("accessToken", AccessToken, options)
 .cookie("refreshToken", RefreshToken, options)
 .json(
     new  ApiResponse(
      200,
      {
        user:loggedInUser,AccessToken,RefreshToken
      },
      "user logged in sccessfully"
     )
 )

})

// !log out user
const logOutUser = asyncHandler(async (req, res) => {
  // ^remove cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
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
  
      const {accessToken, newrefreshToken} = await generateAccessTokenAndRefershToken(user._id)
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken, refreshToken, newrefreshToken
          },
          "Access token refreshed"
        )
      )
    } catch (error) {
      throw new ApiError(401, error?.message || "INvalid refresh token")
    }

 })


//  !passwordChange
  const passwordChange = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body
      
   const user = await User.findById(req.user?._id)
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
  return user
  .status(200)
  .json(200, req.user, "user fetched successfully")
})

// !update details
const updateDetails = asyncHandler(async(req, res)=>{
  const {fullname, email } = req.body

  if(!email || !fullname){
    throw new ApiError(400, "All fields are required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname:fullname,
        email:email
      }
    },
    {new:true}
  ).select("-password")

  return res.status(200)
  .json(new ApiResponse(200, user, "Account details updated"))
})


// !Avatarimage upadte
const updateAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400,"Error while uploading on Avatar")
   }
    const user=await User.findByIdAndUpdate(
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

    return res
    .status(200)
    .json(
      new ApiResponse(200, user , "Avatr is updated")
    )
})

// !CoverImage Update
const updatecoverimage = asyncHandler(async(req,res)=>{

   const acoverimageLocalPath = req.file?.path

   if (!acoverimageLocalPath) {
      throw new ApiError(400,"coverimage file is missing")
   }

   const coverimage = await uploadOnCloudinary(avatarLocalPath)

   if (!coverimage.url) {
      throw new ApiError(400,"Error while uploading on coverimage")
   }
    const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          coverimage:coverimage.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user , "cover image is updated")
    )
})

// !getUserChannelProfile 
const getUserChannelProfile =asyncHandler(async(req,res)=>{
   const {username} = req.params

   if(!username?.trim()){
    throw new Appierror(400,"Username is missing")
   }

   const channel = await User.aggregate([
    {
    $match:{
      usuername:username?.toLowerCase()
    }
   },
   {
    $lookup:{
      from:"Subscription",
      localField:"_id",
      foreignField:"channel",
      as:"Subscription"
    }
   },
   {
    $lookup:{
      from:"Subscription",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
   },
   {
    $addFields:{
      subscribersCount:{
        $size:"$subscribers"
      },
      channelsSubscribedToCount:{
        $size:"subscribedTo"
      },
      isSubscriberd:{
        $cond:{
          if:{$in:[req.user?._id,"subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
    }
   },
   {
     $project:{
      fullName:1,
      username:1,
      subscribersCount:1,
      channelsSubscribedToCount:1,
      isSubscriberd:1,
      avatar:1,
      coverImage:1,
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
        from:"video",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:[
              {
                from:"user",
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
            ]
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
          $first:"$owner"
        }
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].getWatchHistory,
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