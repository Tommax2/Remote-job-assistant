import test from 'node:test'
import assert from 'node:assert/strict'
import { profileFieldsFromResume } from '../services/profileSyncService.js'

test('maps reviewed resume data to career profile fields', () => {
  const result = profileFieldsFromResume({ professionalTitle: ' Developer ', professionalSummary: 'Summary', skills: ['React'], experience: [{ company: 'Acme' }], education: [{ school: 'Example University' }], projects: [{ name: 'Portfolio' }] })
  assert.equal(result.professionalTitle, 'Developer')
  assert.deepEqual(result.skills, ['React'])
  assert.equal(result.experience[0].company, 'Acme')
})

test('does not erase profile sections absent from the resume', () => {
  const result = profileFieldsFromResume({ professionalTitle: '', skills: [], experience: [], education: [], projects: [] })
  assert.deepEqual(result, {})
})

test('normalizes Gemini field aliases for the career profile schema', () => {
  const result = profileFieldsFromResume({
    experience: [{ title: 'Engineer', company: 'Acme' }],
    education: [{ institution: 'Example University', degree: 'BSc' }],
    projects: [{ name: 'App', link: 'https://example.com', technologies: ['React'] }],
  })
  assert.equal(result.experience[0].jobTitle, 'Engineer')
  assert.equal(result.education[0].school, 'Example University')
  assert.equal(result.projects[0].url, 'https://example.com')
})
