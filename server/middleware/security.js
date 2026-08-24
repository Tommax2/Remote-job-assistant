import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

const jsonHandler = (_req, res) => res.status(429).json({ message: 'Too many requests. Please wait and try again.' })
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const generationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false, handler: jsonHandler })
export const sendLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => res.status(429).json({ message: 'Daily Gmail send limit reached. Try again tomorrow.' }) })

export function validateObjectId(param = 'id') {
  return (req, res, next) => mongoose.isValidObjectId(req.params[param]) ? next() : res.status(400).json({ message: `Invalid ${param}` })
}

export function approvedOrigins() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean)
}
