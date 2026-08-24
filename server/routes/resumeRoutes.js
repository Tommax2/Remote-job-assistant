import { Router } from 'express'
import multer from 'multer'
import { deleteResume, getResume, listResumes, updateResume, uploadResume } from '../controllers/resumeController.js'
import { protect } from '../middleware/auth.js'
import { downloadTailoredResume, generateTailoredResume, getTailoredResume } from '../controllers/tailoredResumeController.js'

const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, callback) => callback(allowedTypes.includes(file.mimetype) ? null : new Error('Only PDF and DOCX files are supported'), allowedTypes.includes(file.mimetype)) })
const router = Router()
router.use(protect)
router.post('/upload', upload.single('resume'), uploadResume)
router.post('/tailor/:jobId', generateTailoredResume)
router.get('/:id/pdf', downloadTailoredResume)
router.get('/:id/tailored', getTailoredResume)
router.get('/', listResumes)
router.get('/:id', getResume)
router.patch('/:id', updateResume)
router.delete('/:id', deleteResume)
export default router
