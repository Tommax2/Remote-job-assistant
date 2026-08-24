import ApplicationEvent from '../models/ApplicationEvent.js'

const eventDetails = {
  READY_FOR_REVIEW: ['PREPARED', 'Application prepared'],
  APPROVED: ['APPROVED', 'Application approved'],
  APPLIED: ['SENT', 'Application sent'],
  ASSESSMENT: ['ASSESSMENT', 'Assessment received'],
  INTERVIEW: ['INTERVIEW', 'Interview stage reached'],
  OFFER: ['OFFER', 'Offer received'],
  REJECTED: ['REJECTION', 'Application rejected'],
  WITHDRAWN: ['WITHDRAWN', 'Application withdrawn'],
}

export async function recordApplicationEvent(application, status, description = '', metadata = {}) {
  const [type, title] = eventDetails[status] || ['STATUS_UPDATED', `Status changed to ${status.replaceAll('_', ' ')}`]
  return ApplicationEvent.create({ applicationId: application._id, userId: application.userId, type, title, description, metadata, eventDate: new Date() })
}

export function allowedManualStatus(status) { return ['ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].includes(status) }
