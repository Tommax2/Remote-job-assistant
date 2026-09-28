import test from 'node:test'
import assert from 'node:assert/strict'
import { validateApplicationPlan } from '../services/applicationPlanService.js'
import { actionBucket, localDateKey, sortActions } from '../../client/src/services/planner.js'
import { updateApplicationPlan } from '../controllers/applicationController.js'
import Application from '../models/Application.js'
import User from '../models/User.js'

test('planning updates only allow notes and planning fields', () => {
  assert.deepEqual(validateApplicationPlan({ nextAction: '  Follow up  ', privateNotes: 'My notes', priority: 'HIGH', status: 'APPLIED', userId: 'another-user', emailBody: 'replace email' }), { nextAction: 'Follow up', privateNotes: 'My notes', priority: 'HIGH' })
  assert.throws(() => validateApplicationPlan({ status: 'APPLIED' }), /No planning changes/)
})

test('planning rejects malformed dates and invalid values', () => {
  for (const value of ['2026-02-30', 'tomorrow', '2026-13-01', 123]) assert.throws(() => validateApplicationPlan({ actionDueDate: value }), /valid due date/)
  assert.deepEqual(validateApplicationPlan({ actionDueDate: '2028-02-29' }), { actionDueDate: '2028-02-29' })
  assert.deepEqual(validateApplicationPlan({ actionDueDate: '' }), { actionDueDate: '' })
  assert.throws(() => validateApplicationPlan({ privateNotes: 'a'.repeat(6001) }), /6000/)
  assert.throws(() => validateApplicationPlan({ nextAction: 'a'.repeat(241) }), /240/)
  assert.throws(() => validateApplicationPlan({ priority: 'URGENT' }), /priority/)
  assert.throws(() => validateApplicationPlan({ actionCompleted: 'false' }), /true or false/)
})

test('planner distinguishes overdue, today, upcoming, unscheduled, and completed', () => {
  const today = '2026-09-28'
  assert.equal(actionBucket({ actionDueDate: '2026-09-27' }, today), 'overdue')
  assert.equal(actionBucket({ actionDueDate: today }, today), 'today')
  assert.equal(actionBucket({ actionDueDate: '2026-09-29' }, today), 'upcoming')
  assert.equal(actionBucket({}, today), 'unscheduled')
  assert.equal(actionBucket({ actionDueDate: '2026-09-01', actionCompleted: true }, today), 'completed')
  assert.equal(localDateKey(new Date(2026, 8, 28, 23, 59)), today)
})

test('planner puts earlier dates first and high priority first for the same date', () => {
  const actions = [
    { company: 'No date' },
    { company: 'Normal', actionDueDate: '2026-09-28' },
    { company: 'High', actionDueDate: '2026-09-28', priority: 'HIGH' },
    { company: 'Old', actionDueDate: '2026-09-20' },
    { company: 'Done', actionDueDate: '2026-09-01', actionCompleted: true },
  ]
  assert.deepEqual(sortActions(actions).map((item) => item.company), ['Old', 'High', 'Normal', 'No date', 'Done'])
  assert.equal(actions[0].company, 'No date')
})

test('saving a plan scopes the update to the signed-in owner and validates it', async (t) => {
  t.mock.method(User, 'findOne', (query) => {
    assert.deepEqual(query, { firebaseUid: 'firebase-owner' })
    return { select: async () => ({ _id: 'owner' }) }
  })
  const update = t.mock.method(Application, 'findOneAndUpdate', async (filter, mutation, options) => {
    assert.deepEqual(filter, { _id: 'application', userId: 'owner' })
    assert.deepEqual(mutation, { $set: { privateNotes: 'Interview notes' } })
    assert.equal(options.runValidators, true)
    return { _id: 'application', privateNotes: 'Interview notes' }
  })
  let response
  await updateApplicationPlan({ firebaseUser: { uid: 'firebase-owner' }, params: { id: 'application' }, body: { privateNotes: 'Interview notes', userId: 'intruder' } }, { json: (data) => { response = data } }, (error) => { throw error })
  assert.equal(update.mock.callCount(), 1)
  assert.equal(response.application.privateNotes, 'Interview notes')
})

test('another owner cannot update an application plan', async (t) => {
  t.mock.method(User, 'findOne', () => ({ select: async () => ({ _id: 'owner' }) }))
  t.mock.method(Application, 'findOneAndUpdate', async (filter) => { assert.equal(filter.userId, 'owner'); return null })
  let code
  let response
  const res = { status: (value) => { code = value; return res }, json: (value) => { response = value } }
  await updateApplicationPlan({ firebaseUser: { uid: 'owner' }, params: { id: 'someone-elses-application' }, body: { nextAction: 'Change' } }, res, (error) => { throw error })
  assert.equal(code, 404)
  assert.equal(response.message, 'Application not found')
})
