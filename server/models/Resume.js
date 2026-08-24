import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  type: { type: String, enum: ['MASTER', 'TAILORED'], default: 'MASTER' },
  originalFileName: { type: String, trim: true },
  mimeType: { type: String, trim: true },
  fileSize: { type: Number, min: 0 },
  parsedText: { type: String, required: true, maxlength: 200000 },
  professionalTitle: { type: String, trim: true, maxlength: 160 },
  professionalSummary: { type: String, trim: true, maxlength: 4000 },
  skills: [{ type: String, trim: true, maxlength: 80 }],
  experience: [{ type: mongoose.Schema.Types.Mixed }],
  education: [{ type: mongoose.Schema.Types.Mixed }],
  projects: [{ type: mongoose.Schema.Types.Mixed }],
  targetJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
  status: { type: String, enum: ['NEEDS_REVIEW', 'APPROVED'], default: 'NEEDS_REVIEW' },
  approvedAt: Date,
}, { timestamps: true })

resumeSchema.index({ userId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'MASTER' } })
resumeSchema.index({ userId: 1, targetJobId: 1 }, { unique: true, partialFilterExpression: { type: 'TAILORED' } })
export default mongoose.model('Resume', resumeSchema)
