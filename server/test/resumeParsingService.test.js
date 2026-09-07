import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeParsedResume } from '../services/resumeParsingService.js'

test('normalizes common experience date field variants', () => {
  const parsed = normalizeParsedResume({
    experience: [
      { position: 'Engineer', employer: 'Acme', dates: 'Jan 2021 – Present' },
      { role: 'Analyst', company_name: 'Beta', from: '2018', to: '2020' },
    ],
  })

  assert.deepEqual(parsed.experience[0], {
    position: 'Engineer', employer: 'Acme', dates: 'Jan 2021 – Present',
    jobTitle: 'Engineer', company: 'Acme', location: '', startDate: 'Jan 2021',
    endDate: 'Present', current: true, description: '',
  })
  assert.equal(parsed.experience[1].startDate, '2018')
  assert.equal(parsed.experience[1].endDate, '2020')
})

test('does not split ISO-like dates at their internal hyphens', () => {
  const [item] = normalizeParsedResume({ experience: [{ title: 'Developer', duration: '2022-03 - 2024-08' }] }).experience
  assert.equal(item.startDate, '2022-03')
  assert.equal(item.endDate, '2024-08')
})

test('supports a singular date range field', () => {
  const [item] = normalizeParsedResume({ experience: [{ title: 'Designer', date: '2019 to 2021' }] }).experience
  assert.equal(item.startDate, '2019')
  assert.equal(item.endDate, '2021')
})
