import { Router } from 'express'
import { approveApplication, generateEmail, getApplication, listApplications, listApplicationPlans, prepareBatch, regenerateEmail, updateApplication, updateApplicationPlan, updateApplicationStatus } from '../controllers/applicationController.js'
import { protect } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/security.js'

const router = Router()
router.use(protect)
router.post('/email/:resumeId', generateEmail)
router.post('/prepare-batch', prepareBatch)
router.get('/', listApplications)
router.get('/planner', listApplicationPlans)
router.get('/:id', validateObjectId(), getApplication)
router.patch('/:id', validateObjectId(), updateApplication)
router.patch('/:id/plan', validateObjectId(), updateApplicationPlan)
router.post('/:id/regenerate-email', validateObjectId(), regenerateEmail)
router.post('/:id/approve', validateObjectId(), approveApplication)
router.post('/:id/status', validateObjectId(), updateApplicationStatus)
export default router
