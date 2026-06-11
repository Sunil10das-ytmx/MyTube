import mongoose, { isValidObjectId } from 'mongoose'
import { Video } from '../model/video.model.js'
import { Subscription } from '../model/subscription.model.js'
import { Like } from '../model/like.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId || req.user?._id

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id')
  }

  const videoIds = await Video.find({ owner: channelId }).select('_id views').lean()
  const totalVideos = videoIds.length
  const totalViews = videoIds.reduce((sum, video) => sum + (video.views || 0), 0)

  const totalSubscribers = await Subscription.countDocuments({ channel: channelId })
  const totalLikes = await Like.countDocuments({ video: { $in: videoIds.map((video) => video._id) } })

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalSubscribers,
      totalLikes,
      totalViews
    }, 'Channel stats fetched successfully')
  )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId || req.user?._id
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 12

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id')
  }

  const totalVideos = await Video.countDocuments({ owner: channelId })
  const videos = await Video.find({ owner: channelId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: {
        total: totalVideos,
        page,
        limit,
        pages: Math.max(1, Math.ceil(totalVideos / limit))
      }
    }, 'Channel videos fetched successfully')
  )
})

export {
  getChannelStats,
  getChannelVideos
}
