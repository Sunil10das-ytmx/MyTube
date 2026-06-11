import mongoose, { isValidObjectId } from 'mongoose'
import { Comment } from '../model/comment.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  const filter = { video: videoId }
  const totalComments = await Comment.countDocuments(filter)
  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner', 'username avatar fullname')

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        pagination: {
          total: totalComments,
          page,
          limit,
          pages: Math.max(1, Math.ceil(totalComments / limit))
        }
      },
      'Comments fetched successfully'
    )
  )
})

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { content } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id')
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Comment content is required')
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id
  })

  return res.status(201).json(
    new ApiResponse(201, comment, 'Comment created successfully')
  )
})

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id')
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Comment content is required')
  }

  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new ApiError(404, 'Comment not found')
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to edit this comment')
  }

  comment.content = content.trim()
  await comment.save()

  return res.status(200).json(
    new ApiResponse(200, comment, 'Comment updated successfully')
  )
})

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id')
  }

  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new ApiError(404, 'Comment not found')
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this comment')
  }

  await comment.deleteOne()

  return res.status(200).json(
    new ApiResponse(200, {}, 'Comment deleted successfully')
  )
})

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}
