import mongoose from 'mongoose'

const jobPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  jobTitles: [{ type: String, trim: true, maxlength: 100 }],
  skills: [{ type: String, trim: true, maxlength: 80 }],
  remoteOnly: { type: Boolean, default: true },
  preferredLocations: [{ type: String, trim: true, maxlength: 100 }],
  workFromLocations: [{ type: String, trim: true, maxlength: 100 }],
  employmentTypes: [{ type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] }],
  experienceLevels: [{ type: String, enum: ['ENTRY', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'EXECUTIVE'] }],
  minimumSalary: { type: Number, min: 0, max: 1000000000, default: 0 },
  salaryCurrency: { type: String, enum: ['NGN', 'USD', 'GBP', 'EUR'], default: 'USD' },
  minimumMatchScore: { type: Number, min: 0, max: 100, default: 70 },
}, { timestamps: true })

export default mongoose.model('JobPreference', jobPreferenceSchema)
