import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import preferenceRoutes from './routes/preferenceRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import emailRoutes from './routes/emailRoutes.js'
import { gmailCallback } from './controllers/emailController.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import helmet from 'helmet'
import { apiLimiter, approvedOrigins, authLimiter, generationLimiter, sendLimiter } from './middleware/security.js'
import onboardingRoutes from './routes/onboardingRoutes.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  const origins = approvedOrigins()
  app.use(cors({ origin(origin, callback) { if (!origin || origins.includes(origin.replace(/\/$/, ''))) return callback(null, true); return callback(Object.assign(new Error('Origin is not allowed'), { statusCode: 403 })) }, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], maxAge: 86400 }))
  app.use(express.json({ limit: '20kb' }))
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.use('/api', apiLimiter)
  app.use('/api/auth', authLimiter)
  app.use('/api/jobs/:id/analyze', generationLimiter)
  app.use('/api/resumes/tailor', generationLimiter)
  app.use('/api/applications/prepare-batch', generationLimiter)
  app.use('/api/applications/email', generationLimiter)
  app.use('/api/email/send', sendLimiter)
  // Compatibility callback for Google OAuth clients registered before the email routes were added.
  app.get('/api/auth/google/callback', gmailCallback)
  app.use('/api/auth', authRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/resumes', resumeRoutes)
  app.use('/api/preferences', preferenceRoutes)
  app.use('/api/jobs', jobRoutes)
  app.use('/api/applications', applicationRoutes)
  app.use('/api/email', emailRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/onboarding', onboardingRoutes)
  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))
  app.use((error, _req, res, _next) => {
    console.error(error)
    if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors)[0].message })
    if (error.name === 'CastError') return res.status(400).json({ message: `Invalid value for ${error.path}` })
    if (error.name === 'MulterError' || error.message === 'Only PDF and DOCX files are supported') return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'CV must be 5 MB or smaller' : error.message })
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
    res.status(500).json({ message: 'Internal server error' })
  })
  return app
}
