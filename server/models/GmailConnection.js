import mongoose from 'mongoose'

const gmailConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  encryptedAccessToken: { type: String, required: true },
  encryptedRefreshToken: { type: String },
  tokenExpiry: Date,
  scope: { type: String, trim: true },
  connectedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model('GmailConnection', gmailConnectionSchema)
