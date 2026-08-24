import test from 'node:test'
import assert from 'node:assert/strict'
import { deterministicTailor } from '../services/resumeTailoringService.js'

test('deterministic tailoring prioritizes truthful matching skills and content', () => {
  const profile = { professionalTitle: 'Developer', professionalSummary: 'Builds reliable products.', skills: ['React', 'Node.js', 'Excel'], experience: [], education: [], projects: [] }
  const master = { skills: ['React', 'Node.js', 'Excel'], experience: [{ jobTitle: 'Analyst', description: 'Excel reporting' }, { jobTitle: 'Frontend Developer', description: 'React products' }], education: [], projects: [], professionalSummary: '' }
  const result = deterministicTailor(profile, master, { title: 'React Developer', description: 'React and Node.js required' })
  assert.deepEqual(result.skills.slice(0, 2), ['React', 'Node.js'])
  assert.equal(result.experience[0].jobTitle, 'Frontend Developer')
  assert.match(result.professionalTitle, /React Developer/)
  assert.match(result.professionalSummary, /Targeting the React Developer role/)
  assert.match(result.professionalSummary, /React, Node\.js/)
  assert.match(result.professionalSummary, /Builds reliable products/)
})
