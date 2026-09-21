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

test('fits parsed CV text within career profile field limits', () => {
  const result = profileFieldsFromResume({
    professionalTitle: 'T'.repeat(140),
    professionalSummary: 'S'.repeat(3200),
    skills: ['K'.repeat(70)],
    experience: [{ description: 'E'.repeat(2200) }],
    education: [{ description: 'D'.repeat(2200) }],
    projects: [{ description: 'P'.repeat(2200), technologies: ['R'.repeat(70)] }],
  })

  assert.equal(result.professionalTitle.length, 120)
  assert.equal(result.professionalSummary.length, 3000)
  assert.equal(result.skills[0].length, 60)
  assert.equal(result.experience[0].description.length, 2000)
  assert.equal(result.education[0].description.length, 2000)
  assert.equal(result.projects[0].description.length, 2000)
  assert.equal(result.projects[0].technologies[0].length, 60)
})
