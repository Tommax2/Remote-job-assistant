import mongoose from 'mongoose'

const jobMatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  skillScore: { type: Number, min: 0, max: 100, default: 0 },
  experienceScore: { type: Number, min: 0, max: 100, default: 0 },
  educationScore: { type: Number, min: 0, max: 100, default: 0 },
  locationScore: { type: Number, min: 0, max: 100, default: 0 },
  roleScore: { type: Number, min: 0, max: 100, default: 0 },
  matchedSkills: [{ type: String, trim: true }],
  missingSkills: [{ type: String, trim: true }],
  strengths: [{ type: String, trim: true, maxlength: 500 }],
  gaps: [{ type: String, trim: true, maxlength: 500 }],
  recommendation: { type: String, enum: ['STRONG_MATCH', 'GOOD_MATCH', 'POSSIBLE_MATCH', 'LOW_MATCH'], required: true },
  eligibility: { type: String, enum: ['ELIGIBLE', 'REVIEW_LOCATION', 'LIKELY_INELIGIBLE'], default: 'REVIEW_LOCATION' },
  analysisMode: { type: String, enum: ['PRELIMINARY', 'GEMINI'], default: 'PRELIMINARY' },
}, { timestamps: true })

jobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true })
export default mongoose.model('JobMatch', jobMatchSchema)
