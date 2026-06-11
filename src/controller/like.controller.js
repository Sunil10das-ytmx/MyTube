import mongoose, { isValidObjectId } from 'mongoose'
import { Like } from '../model/like.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const toggleLike = asyncHandler(async (req, res) => {
  const { videoId, commentId, tweetId } = req.params
  const target = videoId || commentId || tweetId
  const field = videoId ? 'video' : commentId ? 'comment' : 'tweet'

  if (!target || !isValidObjectId(target)) {
    throw new ApiError(400, `Invalid ${field} id`)
  }

  const existingLike = await Like.findOne({ [field]: target, likedBy: req.user._id })

  if (existingLike) {
    await existingLike.deleteOne()
    return res.status(200).json(new ApiResponse(200, {}, `${field} like removed successfully`))
  }

  const like = await Like.create({ [field]: target, likedBy: req.user._id })
  return res.status(201).json(new ApiResponse(201, like, `${field} liked successfully`))
})

const getLikedVideos = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 12

  const totalLiked = await Like.countDocuments({ video: { $exists: true }, likedBy: req.user._id })
  const likes = await Like.find({ video: { $exists: true }, likedBy: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('video')

  return res.status(200).json(
    new ApiResponse(200, {
      likes,
      pagination: {
        total: totalLiked,
        page,
        limit,
        pages: Math.max(1, Math.ceil(totalLiked / limit))
      }
    }, 'Liked videos fetched successfully')
  )
})

export {
  toggleLike,
  getLikedVideos
}
