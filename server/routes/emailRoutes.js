import { Router } from 'express'
import { connectGmail, disconnectGmail, gmailCallback, gmailDiagnostics, gmailStatus, sendApplication } from '../controllers/emailController.js'
import { protect } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/security.js'

const router = Router()
router.get('/google/callback', gmailCallback)
router.use(protect)
router.get('/google/connect', connectGmail)
router.get('/google/status', gmailStatus)
router.get('/google/diagnostics', gmailDiagnostics)
router.delete('/google/connection', disconnectGmail)
router.post('/send/:applicationId', validateObjectId('applicationId'), sendApplication)
export default router
