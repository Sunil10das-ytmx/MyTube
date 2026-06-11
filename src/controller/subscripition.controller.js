import mongoose, { isValidObjectId } from 'mongoose'
import { User } from '../model/user.model.js'
import { Subscription } from '../model/subscription.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id')
  }

  if (!req.user?._id) {
    throw new ApiError(401, 'Authentication required')
  }

  if (req.user._id.toString() === channelId) {
    throw new ApiError(400, 'You cannot subscribe to your own channel')
  }

  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id
  })

  if (existingSubscription) {
    await existingSubscription.deleteOne()
    return res.status(200).json(new ApiResponse(200, {}, 'Unsubscribed successfully'))
  }

  const subscription = await Subscription.create({
    channel: channelId,
    subscriber: req.user._id
  })

  return res.status(201).json(new ApiResponse(201, subscription, 'Subscribed successfully'))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id')
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate('subscriber', 'username fullname avatar')
    .lean()

  return res.status(200).json(new ApiResponse(200, subscribers, 'Channel subscribers fetched successfully'))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.params.subscriberId || req.user?._id

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, 'Invalid subscriber id')
  }

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate('channel', 'username fullname avatar')
    .lean()

  return res.status(200).json(new ApiResponse(200, subscriptions, 'Subscribed channels fetched successfully'))
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}