import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

const jsonHandler = (_req, res) => res.status(429).json({ message: 'Too many requests. Please wait and try again.' })
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const generationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const sendLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => res.status(429).json({ message: 'Daily Gmail send limit reached. Try again tomorrow.' }) })
export const jobSyncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.firebaseUser.uid,
  handler: (_req, res) => res.status(429).json({ message: 'Job sources can only be refreshed a few times per hour. Please try again later.' }),
})

export function validateObjectId(param = 'id') {
  return (req, res, next) => mongoose.isValidObjectId(req.params[param]) ? next() : res.status(400).json({ message: `Invalid ${param}` })
}

export function approvedOrigins() {
  const configuredOrigins = (process.env.CLIENT_URL || '').split(',')
  const deploymentOrigins = process.env.NODE_ENV === 'production'
    ? [
        'http://localhost:5173',
        'https://remote-job-assistant-ba96.vercel.app',
        'https://remote-job-assistant-ba96-git-main-tommys-projects-b8fc9b54.vercel.app',
      ]
    : ['http://localhost:5173']

  return [...new Set([...configuredOrigins, ...deploymentOrigins]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean))]
}
