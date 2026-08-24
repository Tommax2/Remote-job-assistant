import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePreliminaryMatch } from '../services/matchingService.js'

test('scores a relevant worldwide role as eligible', () => {
  const result = calculatePreliminaryMatch(
    { professionalTitle: 'Frontend Developer', yearsOfExperience: 4, skills: ['React', 'JavaScript', 'CSS'], education: [{}] },
    { skills: ['React', 'JavaScript'] },
    { jobTitles: ['Frontend Developer'], skills: ['React'], preferredLocations: ['Worldwide'], workFromLocations: ['Nigeria'] },
    { title: 'Frontend Developer', location: 'Worldwide', description: 'We need React, JavaScript and CSS. 3+ years experience. Bachelor degree preferred.' },
  )
  assert.equal(result.eligibility, 'ELIGIBLE')
  assert.equal(result.roleScore, 100)
  assert.equal(result.skillScore, 100)
  assert.ok(result.overallScore >= 80)
})

test('flags a conflicting country restriction', () => {
  const result = calculatePreliminaryMatch(
    { professionalTitle: 'Developer', yearsOfExperience: 2, skills: ['JavaScript'], education: [] },
    null,
    { jobTitles: ['Developer'], preferredLocations: [], workFromLocations: ['Nigeria'] },
    { title: 'Developer', location: 'United States only', description: 'JavaScript developer with 2 years experience.' },
  )
  assert.equal(result.eligibility, 'LIKELY_INELIGIBLE')
  assert.equal(result.locationScore, 0)
  assert.ok(result.gaps.length > 0)
})
