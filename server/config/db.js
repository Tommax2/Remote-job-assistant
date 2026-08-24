import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is not configured')
  mongoose.set('bufferTimeoutMS', 10000)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 15000,
    heartbeatFrequencyMS: 10000,
  })
  console.log('MongoDB connected')
}
