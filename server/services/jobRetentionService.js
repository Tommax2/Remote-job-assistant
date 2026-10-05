import Job, { JOB_RETENTION_SECONDS } from '../models/Job.js'

export function deleteExpiredJobs(now = Date.now()) {
  return Job.deleteMany({ publishedAt: { $lte: new Date(now - JOB_RETENTION_SECONDS * 1000) } })
}

// Also handles databases whose existing publishedAt index predates the TTL rule.
export async function startJobCleanup() {
  await deleteExpiredJobs()
  let running = false
  const timer = setInterval(async () => {
    if (running) return
    running = true
    try {
      await deleteExpiredJobs()
    } catch (error) {
      console.error('Expired job cleanup failed:', error.message)
    } finally {
      running = false
    }
  }, 60 * 60 * 1000)
  timer.unref()
  return timer
}
