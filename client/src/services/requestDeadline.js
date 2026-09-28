// Include authentication and response parsing in the caller's request deadline.
export function withinDeadline(task, signal) {
  if (!signal) return Promise.resolve().then(task)
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve().then(task).then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', abort)
    })
  })
}
