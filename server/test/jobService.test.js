import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeArbeitnowJob, normalizeJobdataNigeriaJob, normalizeJobicyJob, normalizeJobsColliderJob, normalizeRemotiveJob, normalizeRemoteOkJob } from '../services/jobService.js'

test('normalizes a Remotive job into the internal shape', () => {
  const job = normalizeRemotiveJob({ id: 42, company_name: 'Example', company_logo: '', title: 'Developer', description: '<p>Build &amp; ship.</p>', candidate_required_location: 'Worldwide', salary: '$50k', job_type: 'full_time', category: 'Software Development', url: 'https://remotive.com/job/42', publication_date: '2026-08-20T10:00:00Z' })
  assert.equal(job.externalId, '42')
  assert.equal(job.source, 'REMOTIVE')
  assert.equal(job.employmentType, 'FULL_TIME')
  assert.equal(job.description, 'Build & ship.')
  assert.equal(job.remote, true)
})

test('normalizes Jobicy salary and job type', () => {
  const job = normalizeJobicyJob({ id: 7, companyName: 'Acme', jobTitle: 'Designer', jobDescription: '<b>Design things</b>', jobGeo: 'Anywhere', jobType: ['full-time'], jobIndustry: ['Design'], url: 'https://jobicy.com/jobs/7', pubDate: '2026-08-20T10:00:00Z', salaryMin: 50000, salaryMax: 70000, salaryCurrency: 'USD', salaryPeriod: 'yearly' })
  assert.equal(job.source, 'JOBICY')
  assert.equal(job.employmentType, 'FULL_TIME')
  assert.match(job.salary, /50,000/)
})

test('normalizes JobsCollider locations', () => {
  const job = normalizeJobsColliderJob({ id: 'abc', company_name: 'Acme', title: 'Engineer', description: 'Build', locations: ['Europe', 'UK'], category: 'software_development', url: 'https://jobscollider.com/job/abc', published_at: '2026-08-20T10:00:00Z' })
  assert.equal(job.source, 'JOBSCOLLIDER')
  assert.equal(job.location, 'Europe, UK')
  assert.equal(job.category, 'software development')
})

test('normalizes Remote OK jobs', () => {
  const job = normalizeRemoteOkJob({ id: 9, company: 'Acme', position: 'Writer', description: '<p>Write</p>', location: 'Worldwide', tags: ['writing'], apply_url: 'https://remoteok.com/jobs/9', date: '2026-08-20T10:00:00Z' })
  assert.equal(job.source, 'REMOTEOK')
  assert.equal(job.title, 'Writer')
  assert.equal(job.category, 'writing')
})

test('normalizes Arbeitnow remote jobs', () => {
  const job = normalizeArbeitnowJob({ slug: 'developer-1', company_name: 'Acme', title: 'Developer', description: '<p>Build</p>', remote: true, url: 'https://arbeitnow.com/jobs/developer-1', tags: ['Engineering'], job_types: ['full-time'], location: 'Europe', created_at: 1787220000 })
  assert.equal(job.source, 'ARBEITNOW')
  assert.equal(job.employmentType, 'FULL_TIME')
  assert.equal(job.remote, true)
})

test('normalizes jobdataAPI Nigeria remote jobs', () => {
  const job = normalizeJobdataNigeriaJob({ id: 15, company: { name: 'Acme' }, title: 'Remote Engineer', location: 'Lagos, Nigeria', types: [{ name: 'Full Time' }], has_remote: true, published: '2026-08-20T10:00:00Z', description: '<p>Build products</p>', application_url: 'https://example.com/apply', salary_currency: 'NGN' })
  assert.equal(job.source, 'JOBDATA_NIGERIA')
  assert.equal(job.nigeriaBased, true)
  assert.equal(job.employmentType, 'FULL_TIME')
})
