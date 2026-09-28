export function validateApplicationPlan(body) {
  const update = {}
  const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }) }
  for (const [field, limit] of [['nextAction', 240], ['privateNotes', 6000]]) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string' || body[field].length > limit) fail(`${field} must be text with at most ${limit} characters`)
    update[field] = body[field].trim()
  }
  if (body.actionDueDate !== undefined) {
    const date = body.actionDueDate
    if (typeof date !== 'string') fail('Choose a valid due date')
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) fail('Choose a valid due date')
    update.actionDueDate = date
  }
  if (body.priority !== undefined) {
    if (!['NORMAL', 'HIGH'].includes(body.priority)) fail('Choose normal or high priority')
    update.priority = body.priority
  }
  if (body.actionCompleted !== undefined) {
    if (typeof body.actionCompleted !== 'boolean') fail('Action completion must be true or false')
    update.actionCompleted = body.actionCompleted
  }
  if (!Object.keys(update).length) fail('No planning changes provided')
  return update
}
