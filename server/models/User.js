import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  avatarUrl: { type: String, default: '' },
}, { timestamps: true })

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return { id: this.id, name: this.name, email: this.email, avatarUrl: this.avatarUrl }
}

export default mongoose.model('User', userSchema)
