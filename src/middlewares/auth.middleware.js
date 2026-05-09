import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/ApiError";
import jwt from 'jsonwebtoken'
import { User } from "../model/user.model";

export const VerifyJWT= asyncHandler(async(req,res,next)=>{
  try {
      const token = req.cookies?.AccessToken || req.header("Authorizataion")?.replace("Bearer ","")
  
      if(!token){
          throw new ApiError(401,"Unauthorized Request")
      }
  
      const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
      const user  = await User.findById(verifyToken?._id).select(" -password -RefreshToken")
  
      if(!user){
          throw new ApiError(401,"Invalid Access Token")
      }

      req.user = user;
      next()
  } catch (error) {
    throw new error (401,error?.message || "Invalid access token")
  }
     
})  