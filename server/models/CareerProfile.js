import mongoose from 'mongoose'

const linkValidator = {
  validator: (value) => !value || /^https?:\/\//i.test(value),
  message: 'Links must start with http:// or https://',
}

const experienceSchema = new mongoose.Schema({
  jobTitle: { type: String, trim: true, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 120 },
  startDate: { type: String, trim: true, maxlength: 30 },
  endDate: { type: String, trim: true, maxlength: 30 },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 2000 },
}, { _id: true })

const educationSchema = new mongoose.Schema({
  school: { type: String, trim: true, maxlength: 160 },
  degree: { type: String, trim: true, maxlength: 160 },
  fieldOfStudy: { type: String, trim: true, maxlength: 160 },
  startDate: { type: String, trim: true, maxlength: 30 },
  endDate: { type: String, trim: true, maxlength: 30 },
}, { _id: true })

const projectSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  technologies: [{ type: String, trim: true, maxlength: 60 }],
  url: { type: String, trim: true, validate: linkValidator },
}, { _id: true })

const careerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, trim: true, maxlength: 30 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
  location: { type: String, trim: true, maxlength: 120 },
  professionalTitle: { type: String, required: true, trim: true, maxlength: 120 },
  professionalSummary: { type: String, trim: true, maxlength: 3000 },
  yearsOfExperience: { type: Number, min: 0, max: 70, default: 0 },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  portfolio: {
    linkedin: { type: String, trim: true, validate: linkValidator },
    github: { type: String, trim: true, validate: linkValidator },
    website: { type: String, trim: true, validate: linkValidator },
  },
}, { timestamps: true })

export default mongoose.model('CareerProfile', careerProfileSchema)
