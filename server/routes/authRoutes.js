import { Router } from 'express'
import { syncUser } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.post('/sync', protect, syncUser)
export default router
