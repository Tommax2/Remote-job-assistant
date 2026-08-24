import Job from '../models/Job.js'
import { extractApplicationEmail } from './jobEmailService.js'

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs'
const JOBICY_URL = 'https://jobicy.com/api/v2/remote-jobs'
const JOBSCOLLIDER_URL = 'https://jobscollider.com/api/search-jobs'
const REMOTEOK_URL = 'https://remoteok.com/api'
const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api'
const JOBDATA_NIGERIA_URL = 'https://jobdataapi.com/api/jobs/?country_code=NG&has_remote=true'
const typeMap = { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACT', freelance: 'FREELANCE', internship: 'INTERNSHIP' }
const nigeriaBased = (location = '') => /(^|\W)(nigeria|lagos|abuja|port harcourt|ibadan|enugu|kano|ogun|oyo|rivers)(\W|$)/i.test(location)

function plainText(html = '') {
  return html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim()
}

export function normalizeRemotiveJob(job) {
  return {
    externalId: String(job.id), source: 'REMOTIVE', company: job.company_name,
    companyLogo: job.company_logo || '', title: job.title,
    description: plainText(job.description), location: job.candidate_required_location || 'Worldwide',
    remote: true, nigeriaBased: nigeriaBased(job.candidate_required_location), salary: job.salary || '', employmentType: typeMap[job.job_type] || 'OTHER',
    category: job.category || '', applicationUrl: job.url,
    publishedAt: new Date(job.publication_date), lastSeenAt: new Date(), active: true,
  }
}

function normalizedType(value = '') {
  return typeMap[value.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')] || 'OTHER'
}

function salaryText(min, max, currency = 'USD', period = 'year') {
  if (!min && !max) return ''
  const range = min && max ? `${Number(min).toLocaleString()}–${Number(max).toLocaleString()}` : Number(min || max).toLocaleString()
  return `${currency} ${range} / ${period}`
}

export function normalizeJobicyJob(job) {
  return {
    externalId: String(job.id), source: 'JOBICY', company: job.companyName,
    companyLogo: job.companyLogo || '', title: job.jobTitle,
    description: plainText(job.jobDescription || job.jobExcerpt), location: job.jobGeo || 'Anywhere',
    remote: true, nigeriaBased: nigeriaBased(job.jobGeo), salary: salaryText(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod),
    employmentType: normalizedType(job.jobType?.[0]), category: job.jobIndustry?.join(', ') || '',
    applicationUrl: job.url, publishedAt: new Date(job.pubDate), lastSeenAt: new Date(), active: true,
  }
}

export function normalizeJobsColliderJob(job) {
  return {
    externalId: String(job.id), source: 'JOBSCOLLIDER', company: job.company_name,
    companyLogo: job.company_logo || '', title: job.title,
    description: plainText(job.description), location: job.locations?.join(', ') || 'Worldwide',
    remote: true, nigeriaBased: nigeriaBased(job.locations?.join(', ')), salary: salaryText(job.salary_min, job.salary_max), employmentType: 'OTHER',
    category: job.category?.replaceAll('_', ' ') || '', applicationUrl: job.url,
    publishedAt: new Date(job.published_at), lastSeenAt: new Date(), active: true,
  }
}

export function normalizeRemoteOkJob(job) {
  return {
    externalId: String(job.id), source: 'REMOTEOK', company: job.company,
    companyLogo: job.company_logo || job.logo || '', title: job.position,
    description: plainText(job.description), location: job.location || 'Worldwide', remote: true, nigeriaBased: nigeriaBased(job.location),
    salary: salaryText(job.salary_min, job.salary_max), employmentType: 'OTHER',
    category: job.tags?.join(', ') || '', applicationUrl: job.apply_url || job.url,
    publishedAt: new Date(job.date || Number(job.epoch) * 1000), lastSeenAt: new Date(), active: true,
  }
}

export function normalizeArbeitnowJob(job) {
  return {
    externalId: String(job.slug), source: 'ARBEITNOW', company: job.company_name,
    companyLogo: '', title: job.title, description: plainText(job.description),
    location: job.location || 'Europe', remote: true, nigeriaBased: nigeriaBased(job.location), salary: '',
    employmentType: normalizedType(job.job_types?.[0]), category: job.tags?.join(', ') || '',
    applicationUrl: job.url, publishedAt: new Date(Number(job.created_at) * 1000),
    lastSeenAt: new Date(), active: true,
  }
}

export function normalizeJobdataNigeriaJob(job) {
  const company = typeof job.company === 'object' ? job.company : {}
  const type = Array.isArray(job.types) ? job.types[0] : null
  const typeName = typeof type === 'object' ? type?.name : type
  const location = job.location || [...(job.cities || []).map((item) => item.name || item), ...(job.states || []).map((item) => item.name || item), ...(job.countries || []).map((item) => item.name || item)].filter(Boolean).join(', ') || 'Nigeria'
  return {
    externalId: String(job.id || job.ext_id), source: 'JOBDATA_NIGERIA',
    company: company.name || job.company_name || 'Employer', companyLogo: company.logo || company.logo_url || '',
    title: job.title, description: plainText(job.description), location, remote: Boolean(job.has_remote),
    nigeriaBased: true, salary: salaryText(job.salary_min, job.salary_max, job.salary_currency),
    employmentType: normalizedType(typeName), category: '', applicationUrl: job.application_url,
    publishedAt: new Date(job.published), lastSeenAt: new Date(), active: true,
  }
}

async function fetchJson(url, extraHeaders = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'RemoteReady/0.1', ...extraHeaders } })
    if (!response.ok) throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}`)
    return response.json()
  } finally { clearTimeout(timeout) }
}

async function storeJobs(jobs, source) {
  jobs.forEach((job) => { job.applicationEmail = job.applicationEmail || extractApplicationEmail(job.applicationUrl, job.description) })
  const valid = jobs.filter((job) => job.externalId && job.title && job.company && job.applicationUrl && job.description && !Number.isNaN(job.publishedAt.valueOf()))
  if (!valid.length) return { fetched: 0, stored: 0, updated: 0, source }
  const operations = valid.map((job) => ({ updateOne: { filter: { source: job.source, externalId: job.externalId }, update: { $set: job }, upsert: true } }))
  const result = await Job.bulkWrite(operations, { ordered: false })
  return { fetched: valid.length, stored: result.upsertedCount, updated: result.modifiedCount, source }
}

export async function syncRemotiveJobs({ limit = 100 } = {}) {
  const data = await fetchJson(`${REMOTIVE_URL}?limit=${Math.min(Math.max(limit, 1), 200)}`)
  const jobs = (data.jobs || []).filter((job) => job.id && job.title && job.company_name && job.url && job.description).map(normalizeRemotiveJob)
  return storeJobs(jobs, 'Remotive')
}

export async function syncJobicyJobs({ limit = 100 } = {}) {
  const data = await fetchJson(`${JOBICY_URL}?count=${Math.min(Math.max(limit, 1), 100)}`)
  return storeJobs((data.jobs || []).map(normalizeJobicyJob), 'Jobicy')
}

export async function syncJobsColliderJobs() {
  const data = await fetchJson(JOBSCOLLIDER_URL)
  return storeJobs((data.jobs || []).map(normalizeJobsColliderJob), 'JobsCollider')
}

export async function syncNigeriaJobs() {
  const data = await fetchJson(`${JOBSCOLLIDER_URL}?query=nigeria`)
  const jobs = (data.jobs || []).filter((job) => nigeriaBased(job.locations?.join(', '))).map(normalizeJobsColliderJob)
  return storeJobs(jobs, 'JobsCollider Nigeria')
}

export async function syncJobdataNigeriaJobs() {
  const headers = process.env.JOBDATA_API_KEY ? { Authorization: `Api-Key ${process.env.JOBDATA_API_KEY}` } : {}
  const data = await fetchJson(JOBDATA_NIGERIA_URL, headers)
  return storeJobs((data.results || []).filter((job) => job.has_remote === true).map(normalizeJobdataNigeriaJob), 'jobdataAPI Nigeria')
}

export async function syncRemoteOkJobs() {
  const data = await fetchJson(REMOTEOK_URL)
  return storeJobs((Array.isArray(data) ? data.slice(1) : []).map(normalizeRemoteOkJob), 'Remote OK')
}

export async function syncArbeitnowJobs() {
  const data = await fetchJson(ARBEITNOW_URL)
  return storeJobs((data.data || []).filter((job) => job.remote === true).map(normalizeArbeitnowJob), 'Arbeitnow')
}

export async function syncAllJobSources() {
  const sourceNames = ['Remotive', 'Jobicy', 'JobsCollider', 'Remote OK', 'Arbeitnow', 'JobsCollider Nigeria', 'jobdataAPI Nigeria']
  const settled = await Promise.allSettled([syncRemotiveJobs(), syncJobicyJobs(), syncJobsColliderJobs(), syncRemoteOkJobs(), syncArbeitnowJobs(), syncNigeriaJobs(), syncJobdataNigeriaJobs()])
  const sources = settled.map((result, index) => result.status === 'fulfilled' ? result.value : { source: sourceNames[index], error: result.reason.message })
  return {
    sources,
    fetched: sources.reduce((sum, source) => sum + (source.fetched || 0), 0),
    stored: sources.reduce((sum, source) => sum + (source.stored || 0), 0),
    updated: sources.reduce((sum, source) => sum + (source.updated || 0), 0),
  }
}
