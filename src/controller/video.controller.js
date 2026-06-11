import { isValidObjectId } from 'mongoose'
import { Video } from '../model/video.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadData } from '../utils/cloudinary.js'

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = 'createdAt',
    sortType = 'desc',
    userId
  } = req.query

  const pageNumber = Math.max(1, Number(page))
  const pageLimit = Math.max(1, Number(limit))

  const filter = {}

  if (query?.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } }
    ]
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, 'Invalid user id')
    }
    filter.owner = userId
  }

  const validSortFields = ['createdAt', 'views', 'title', 'duration']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  const sortDirection = sortType === 'asc' ? 1 : -1

  const totalVideos = await Video.countDocuments(filter)
  const videos = await Video.find(filter)
    .sort({ [sortField]: sortDirection })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit)
    .populate('owner', 'username fullname avatar')
    .lean()

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total: totalVideos,
          page: pageNumber,
          limit: pageLimit,
          pages: Math.max(1, Math.ceil(totalVideos / pageLimit))
        }
      },
      'Videos fetched successfully'
    )
  )
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!req.user?._id) {
    throw new ApiError(401, 'Authentication required')
  }

  if (!title?.trim()) {
    throw new ApiError(400, 'Video title is required')
  }

  if (!description?.trim()) {
    throw new ApiError(400, 'Video description is required')
  }

  let videoUrl = req.body.videoFile
  let thumbnailUrl = req.body.thumnail || req.body.thumbnail

  if (req.files?.videoFile?.length) {
    const uploadedVideo = await uploadData(req.files.videoFile[0].path)
    if (!uploadedVideo) {
      throw new ApiError(500, 'Video upload failed')
    }
    videoUrl = uploadedVideo.secure_url || uploadedVideo.url
  }

  const thumbnailFile = req.files?.thumnail?.[0] || req.files?.thumbnail?.[0]
  if (thumbnailFile) {
    const uploadedThumbnail = await uploadData(thumbnailFile.path)
    if (!uploadedThumbnail) {
      throw new ApiError(500, 'Thumbnail upload failed')
    }
    thumbnailUrl = uploadedThumbnail.secure_url || uploadedThumbnail.url
  }

  if (!videoUrl) {
    throw new ApiError(400, 'Video file is required')
  }

  if (!thumbnailUrl) {
    throw new ApiError(400, 'Thumbnail is required')
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoUrl,
    thumnail: thumbnailUrl,
    owner: req.user._id
  })

  return res.status(201).json(new ApiResponse(201, video, 'Video uploaded successfully'))
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('owner', 'username fullname avatar')

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  return res.status(200).json(new ApiResponse(200, video, 'Video fetched successfully'))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to update this video')
  }

  if (title?.trim()) {
    video.title = title.trim()
  }

  if (description?.trim()) {
    video.description = description.trim()
  }

  if (req.files?.videoFile?.length) {
    const uploadResult = await uploadData(req.files.videoFile[0].path)
    if (!uploadResult) {
      throw new ApiError(500, 'Video upload failed')
    }
    video.videoFile = uploadResult.secure_url || uploadResult.url
  }

  const thumbnailFile = req.files?.thumnail?.[0] || req.files?.thumbnail?.[0]
  if (thumbnailFile) {
    const uploadResult = await uploadData(thumbnailFile.path)
    if (!uploadResult) {
      throw new ApiError(500, 'Thumbnail upload failed')
    }
    video.thumnail = uploadResult.secure_url || uploadResult.url
  }

  await video.save()
  return res.status(200).json(new ApiResponse(200, video, 'Video updated successfully'))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to delete this video')
  }

  await video.deleteOne()

  return res.status(200).json(new ApiResponse(200, {}, 'Video deleted successfully'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (video.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to update this video')
  }

  video.isPublished = !video.isPublished
  await video.save()

  return res.status(200).json(
    new ApiResponse(200, video, `Video is now ${video.isPublished ? 'published' : 'unpublished'}`)
  )
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}