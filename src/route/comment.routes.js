import { Router } from 'express'
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
} from '../controller/comment.controller.js'
import { VerifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/video/:videoId').get(getVideoComments).post(VerifyJWT, addComment)
router.route('/:commentId').patch(VerifyJWT, updateComment).delete(VerifyJWT, deleteComment)

export default router
