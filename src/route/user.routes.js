import { Router } from 'express';
import {
  logInUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
  passwordChange,
  findUser,
  updateDetails,
  updateAvatar,
  updatecoverimage,
  getUserChannelProfile,
  getWatchHistory,
} from '../controller/user.controller.js';

import { upload } from '../middlewares/multer.middleware.js';
import { VerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route('/login').post(logInUser);

// !secured routes
router.route('/logout').post(VerifyJWT, logOutUser);
router.route('/refreshtoken').post(refreshAccessToken);
router.route('/changePassword').post(VerifyJWT, passwordChange);
router.route('/CurrentUser').get(VerifyJWT, findUser);
router.route('/UpdateDetails').patch(VerifyJWT, updateDetails);
router
  .route('/UpdateAvatar')
  .patch(VerifyJWT, upload.single('Avatar'), updateAvatar);
router
  .route('/UpdateCoverImage')
  .patch(VerifyJWT, upload.single('CoverImage'), updatecoverimage);
router.route('/c/:username').get(VerifyJWT, getUserChannelProfile);
router.route('/WatchHistory').get(VerifyJWT, getWatchHistory);

export default router;
