import { Router } from 'express'
import { analyzeMatch, getJob, getMatch, ignoreJob, listJobs, listSavedJobs, saveJob, syncJobs, unsaveJob } from '../controllers/jobController.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', listJobs)
router.get('/saved', listSavedJobs)
router.post('/sync', syncJobs)
router.post('/:id/save', saveJob)
router.delete('/:id/save', unsaveJob)
router.post('/:id/ignore', ignoreJob)
router.post('/:id/analyze', analyzeMatch)
router.get('/:id/match', getMatch)
router.get('/:id', getJob)
export default router
