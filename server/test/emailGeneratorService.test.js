import test from 'node:test'
import assert from 'node:assert/strict'
import { createTemplateEmail } from '../services/emailGeneratorService.js'

test('template email uses verified matching skills and target job details', () => {
  const result = createTemplateEmail({ fullName: 'Ada Okafor', email: 'ada@example.com' }, { skills: ['React', 'Excel'], professionalSummary: 'Frontend developer building accessible products.' }, { title: 'React Developer', company: 'Example Ltd', description: 'Seeking React and TypeScript experience.' })
  assert.match(result.subject, /React Developer/)
  assert.match(result.body, /Example Ltd/)
  assert.match(result.body, /React/)
  assert.doesNotMatch(result.body, /TypeScript/)
})
