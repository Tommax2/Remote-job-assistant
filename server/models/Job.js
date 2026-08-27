import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  externalId: { type: String, required: true, trim: true },
  source: { type: String, required: true, enum: ['REMOTIVE', 'JOBICY', 'JOBSCOLLIDER', 'REMOTEOK', 'ARBEITNOW', 'JOBDATA_NIGERIA', 'ADZUNA'], index: true },
  company: { type: String, required: true, trim: true, maxlength: 200 },
  companyLogo: { type: String, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 240 },
  description: { type: String, required: true, maxlength: 100000 },
  location: { type: String, trim: true, default: 'Worldwide' },
  remote: { type: Boolean, default: true },
  nigeriaBased: { type: Boolean, default: false, index: true },
  salary: { type: String, trim: true, maxlength: 200 },
  employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'OTHER'], default: 'OTHER' },
  category: { type: String, trim: true },
  applicationUrl: { type: String, required: true, trim: true },
  applicationEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  publishedAt: { type: Date, required: true, index: true },
  lastSeenAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true })

jobSchema.index({ source: 1, externalId: 1 }, { unique: true })
jobSchema.index({ title: 'text', company: 'text', description: 'text' })
export default mongoose.model('Job', jobSchema)
