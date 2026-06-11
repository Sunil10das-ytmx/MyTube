import mongoose, { isValidObjectId } from 'mongoose'
import { Tweet } from '../model/tweet.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!req.user?._id) {
    throw new ApiError(401, 'Authentication required')
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Tweet content is required')
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id
  })

  return res.status(201).json(new ApiResponse(201, tweet, 'Tweet created successfully'))
})

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user?._id

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }

  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .populate('owner', 'username avatar fullname')
    .lean()

  return res.status(200).json(new ApiResponse(200, tweets, 'User tweets fetched successfully'))
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id')
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Tweet content is required')
  }

  const tweet = await Tweet.findById(tweetId)

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found')
  }

  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to update this tweet')
  }

  tweet.content = content.trim()
  await tweet.save()

  return res.status(200).json(new ApiResponse(200, tweet, 'Tweet updated successfully'))
})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id')
  }

  const tweet = await Tweet.findById(tweetId)

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found')
  }

  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to delete this tweet')
  }

  await tweet.deleteOne()

  return res.status(200).json(new ApiResponse(200, {}, 'Tweet deleted successfully'))
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}