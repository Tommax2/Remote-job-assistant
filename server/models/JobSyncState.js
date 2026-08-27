import mongoose from 'mongoose'

const jobSyncStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  lockToken: { type: String },
  lockedUntil: { type: Date },
  startedAt: { type: Date },
  lastCompletedAt: { type: Date },
  lastError: { type: String, maxlength: 500 },
}, { timestamps: true })

export default mongoose.model('JobSyncState', jobSyncStateSchema)
