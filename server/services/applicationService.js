export function validateApplicationForApproval(application, resume) {
  if (!application) return 'Application draft not found'
  if (!resume || resume.type !== 'TAILORED') return 'A tailored CV is required before approval'
  if (!String(application.emailSubject || '').trim()) return 'Email subject is required before approval'
  if (!String(application.emailBody || '').trim()) return 'Email body is required before approval'
  if (!['READY_FOR_REVIEW', 'APPROVED'].includes(application.status)) return `Application cannot be approved from ${application.status} status`
  return null
}
