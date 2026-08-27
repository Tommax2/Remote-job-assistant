import { Router } from 'express'
import { connectGmail, disconnectGmail, finalizeGmail, gmailCallback, gmailStatus, sendApplication } from '../controllers/emailController.js'
import { protect } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/security.js'

const router = Router()
router.get('/google/callback', gmailCallback)
router.use(protect)
router.get('/google/connect', connectGmail)
router.post('/google/finalize', finalizeGmail)
router.get('/google/status', gmailStatus)
router.delete('/google/connection', disconnectGmail)
router.post('/send/:applicationId', validateObjectId('applicationId'), sendApplication)
export default router
