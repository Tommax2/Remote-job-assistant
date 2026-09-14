import test from 'node:test'
import assert from 'node:assert/strict'
import { extractLinksFromHtml, normalizeParsedResume } from '../services/resumeParsingService.js'

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

test('normalizes education school and description field variants', () => {
  const [item] = normalizeParsedResume({
    education: [{ institution: 'Lagos Business School', qualification: 'BSc', major: 'Economics', dates: '2018 - 2022', details: 'First Class Honours' }],
  }).education

  assert.equal(item.school, 'Lagos Business School')
  assert.equal(item.degree, 'BSc')
  assert.equal(item.fieldOfStudy, 'Economics')
  assert.equal(item.startDate, '2018')
  assert.equal(item.endDate, '2022')
  assert.equal(item.description, 'First Class Honours')
})

test('normalizes project details and links', () => {
  const [item] = normalizeParsedResume({
    projects: [{ project_name: 'Job Assistant', details: 'Matches candidates to jobs.', tech_stack: 'React, Node.js', repository: 'https://github.com/example/job-assistant' }],
  }).projects

  assert.equal(item.name, 'Job Assistant')
  assert.equal(item.description, 'Matches candidates to jobs.')
  assert.deepEqual(item.technologies, ['React', 'Node.js'])
  assert.equal(item.url, 'https://github.com/example/job-assistant')
})

test('normalizes alternate and plain-text project names', () => {
  const projects = normalizeParsedResume({ projects: [{ projectTitle: 'Portfolio Website' }, 'Task Manager'] }).projects

  assert.equal(projects[0].name, 'Portfolio Website')
  assert.equal(projects[1].name, 'Task Manager')
})

test('preserves embedded DOCX hyperlinks for resume parsing', () => {
  assert.deepEqual(
    extractLinksFromHtml('<p>Portfolio: <a href="https://example.com/project?a=1&amp;b=2"><strong>View project</strong></a></p>'),
    ['View project: https://example.com/project?a=1&b=2'],
  )
})
