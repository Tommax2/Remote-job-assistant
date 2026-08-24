import { Router } from 'express'
import { getPreferences, savePreferences } from '../controllers/preferenceController.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', getPreferences)
router.post('/', savePreferences)
router.patch('/', savePreferences)
export default router
