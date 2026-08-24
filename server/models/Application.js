import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  company: { type: String, required: true, trim: true, maxlength: 200 },
  position: { type: String, required: true, trim: true, maxlength: 240 },
  matchScore: { type: Number, min: 0, max: 100 },
  emailSubject: { type: String, required: true, trim: true, maxlength: 300 },
  emailBody: { type: String, required: true, maxlength: 12000 },
  recipientEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  status: { type: String, enum: ['PREPARING', 'READY_FOR_REVIEW', 'APPROVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'], default: 'READY_FOR_REVIEW' },
  generationMode: { type: String, enum: ['TEMPLATE', 'GEMINI'], default: 'TEMPLATE' },
  preparedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  appliedAt: Date,
  gmailMessageId: { type: String, trim: true },
  emailSendAttempts: { type: Number, min: 0, default: 0 },
  lastSendAttemptAt: Date,
  lastSendError: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true })

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true })
export default mongoose.model('Application', applicationSchema)
