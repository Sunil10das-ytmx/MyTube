import mongoose, { isValidObjectId } from 'mongoose'
import { Playlist } from '../model/playlist.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (!req.user?._id) {
    throw new ApiError(401, 'Authentication required')
  }

  if (!name?.trim()) {
    throw new ApiError(400, 'Playlist name is required')
  }

  if (!description?.trim()) {
    throw new ApiError(400, 'Playlist description is required')
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    video: [],
    owner: req.user._id
  })

  return res.status(201).json(new ApiResponse(201, playlist, 'Playlist created successfully'))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user?._id

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }

  const playlists = await Playlist.find({ owner: userId }).populate('video').lean()

  return res.status(200).json(new ApiResponse(200, playlists, 'User playlists fetched successfully'))
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id')
  }

  const playlist = await Playlist.findById(playlistId).populate('video').lean()

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  return res.status(200).json(new ApiResponse(200, playlist, 'Playlist fetched successfully'))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid playlist or video id')
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  if (playlist.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to modify this playlist')
  }

  if (playlist.video.includes(videoId)) {
    return res.status(200).json(new ApiResponse(200, playlist, 'Video already exists in playlist'))
  }

  playlist.video.push(videoId)
  await playlist.save()

  return res.status(200).json(new ApiResponse(200, playlist, 'Video added to playlist successfully'))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid playlist or video id')
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  if (playlist.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to modify this playlist')
  }

  playlist.video = playlist.video.filter((id) => id.toString() !== videoId)
  await playlist.save()

  return res.status(200).json(new ApiResponse(200, playlist, 'Video removed from playlist successfully'))
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id')
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  if (playlist.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to delete this playlist')
  }

  await playlist.deleteOne()

  return res.status(200).json(new ApiResponse(200, {}, 'Playlist deleted successfully'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id')
  }

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }

  if (playlist.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, 'Not authorized to update this playlist')
  }

  if (name?.trim()) playlist.name = name.trim()
  if (description?.trim()) playlist.description = description.trim()

  await playlist.save()

  return res.status(200).json(new ApiResponse(200, playlist, 'Playlist updated successfully'))
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}