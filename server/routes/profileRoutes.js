import { Router } from 'express'
import { getProfile, saveProfile } from '../controllers/profileController.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', getProfile)
router.post('/', saveProfile)
router.patch('/', saveProfile)
export default router
