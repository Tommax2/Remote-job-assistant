import dotenv from 'dotenv'

// Always load the server environment file, regardless of the directory used to launch Node.
dotenv.config({ path: new URL('.env', import.meta.url) })

const port = process.env.PORT || 5000

try {
  const required = ['MONGODB_URI', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
  const missing = required.filter((name) => !process.env[name])
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)

  const [{ createApp }, { connectDatabase }] = await Promise.all([
    import('./app.js'),
    import('./config/db.js'),
  ])
  await connectDatabase(process.env.MONGODB_URI)
  createApp().listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`))
} catch (error) {
  console.error(`Startup failed: ${error?.message || error}`)
  process.exit(1)
}
