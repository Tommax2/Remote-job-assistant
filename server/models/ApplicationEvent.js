import mongoose from 'mongoose'

const applicationEventSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['PREPARED', 'APPROVED', 'SENT', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTION', 'WITHDRAWN', 'STATUS_UPDATED'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  eventDate: { type: Date, default: Date.now, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

applicationEventSchema.index({ applicationId: 1, eventDate: -1 })
export default mongoose.model('ApplicationEvent', applicationEventSchema)
