import mongoose from 'mongoose'

const gmailOAuthAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stateHash: { type: String, required: true, unique: true, index: true },
  encryptedCode: { type: String },
  clientUrl: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['AWAITING_CALLBACK', 'CALLBACK_RECEIVED', 'EXCHANGING', 'COMPLETED'], default: 'AWAITING_CALLBACK' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

export default mongoose.model('GmailOAuthAttempt', gmailOAuthAttemptSchema)
