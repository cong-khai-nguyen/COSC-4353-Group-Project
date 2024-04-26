import express from 'express'
import {
  loadProfile,
  profile,
} from '../controllers/profileController'
import verifyTokens from '../middlewares/verifyToken'
const profileRouter = express.Router()

profileRouter.route('/').post(verifyTokens, profile)
profileRouter.route('/').get(verifyTokens, loadProfile)

export default profileRouter