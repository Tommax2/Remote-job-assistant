import dotenv from 'dotenv'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'

// Always load the server environment file, regardless of the directory used to launch Node.
dotenv.config({ path: new URL('.env', import.meta.url) })

const port = process.env.PORT || 5000

try {
  await connectDatabase(process.env.MONGODB_URI)
  createApp().listen(port, () => console.log(`API listening on port ${port}`))
} catch (error) {
  console.error(`Startup failed: ${error.message}`)
  process.exit(1)
}
