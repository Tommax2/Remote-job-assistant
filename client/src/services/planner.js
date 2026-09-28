export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function actionBucket(application, today = localDateKey()) {
  if (application.actionCompleted) return 'completed'
  if (!application.actionDueDate) return 'unscheduled'
  if (application.actionDueDate < today) return 'overdue'
  return application.actionDueDate === today ? 'today' : 'upcoming'
}

export function sortActions(applications) {
  return [...applications].sort((a, b) => Number(Boolean(a.actionCompleted)) - Number(Boolean(b.actionCompleted))
    || (a.actionDueDate || '9999').localeCompare(b.actionDueDate || '9999')
    || Number(b.priority === 'HIGH') - Number(a.priority === 'HIGH')
    || a.company.localeCompare(b.company))
}

export function displayDueDate(value) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'
}
