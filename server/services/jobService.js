import crypto from 'node:crypto'
import Job from '../models/Job.js'
import JobSyncState from '../models/JobSyncState.js'
import { extractApplicationEmail } from './jobEmailService.js'

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs'
const JOBICY_URL = 'https://jobicy.com/api/v2/remote-jobs'
const JOBSCOLLIDER_URL = 'https://jobscollider.com/api/search-jobs'
const REMOTEOK_URL = 'https://remoteok.com/api'
const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api'
const JOBDATA_NIGERIA_URL = 'https://jobdataapi.com/api/jobs/?country_code=NG&has_remote=true'
const ADZUNA_URL = 'https://api.adzuna.com/v1/api/jobs'
const typeMap = { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACT', freelance: 'FREELANCE', internship: 'INTERNSHIP' }
const nigeriaBased = (location = '') => /(^|\W)(nigeria|lagos|abuja|port harcourt|ibadan|enugu|kano|ogun|oyo|rivers)(\W|$)/i.test(location)
const SYNC_COOLDOWN_MS = 5 * 60 * 1000
const SYNC_LOCK_MS = 3 * 60 * 1000

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

export function normalizeAdzunaJob(job, country = 'gb') {
  const location = job.location?.display_name || job.location?.area?.join(', ') || 'Remote'
  const contract = String(job.contract_time || job.contract_type || '').toLowerCase()
  const employmentType = contract === 'full_time' ? 'FULL_TIME' : contract === 'part_time' ? 'PART_TIME' : contract === 'contract' ? 'CONTRACT' : 'OTHER'
  const currency = ({ gb: 'GBP', us: 'USD', ca: 'CAD', au: 'AUD', nz: 'NZD', za: 'ZAR', in: 'INR', sg: 'SGD' })[country] || country.toUpperCase()
  return {
    externalId: String(job.id), source: 'ADZUNA', company: job.company?.display_name || 'Employer',
    companyLogo: '', title: job.title, description: plainText(job.description), location,
    remote: true, nigeriaBased: nigeriaBased(location), salary: salaryText(job.salary_min, job.salary_max, currency),
    employmentType, category: job.category?.label || '', applicationUrl: job.redirect_url,
    publishedAt: new Date(job.created), lastSeenAt: new Date(), active: true,
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

export async function syncAdzunaJobs({ limit = 50 } = {}) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return { fetched: 0, stored: 0, updated: 0, source: 'Adzuna', skipped: true }
  const supportedCountries = new Set(['gb', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es', 'fr', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'za'])
  const country = String(process.env.ADZUNA_COUNTRY || 'us').trim().toLowerCase()
  if (!supportedCountries.has(country)) throw new Error('ADZUNA_COUNTRY is not supported by the Adzuna API')
  const params = new URLSearchParams({ app_id: appId, app_key: appKey, results_per_page: String(Math.min(Math.max(limit, 1), 50)), what_or: 'remote Nigeria worldwide anywhere global Africa', sort_by: 'date', 'content-type': 'application/json' })
  const data = await fetchJson(`${ADZUNA_URL}/${country}/search/1?${params}`)
  const remoteTerms = /\b(remote|work from home|home.?based|distributed|anywhere)\b/i
  const nigeriaEligibleTerms = /\b(nigeria|worldwide|anywhere|global|africa.?wide|across africa|work from anywhere|remote from anywhere)\b/i
  const jobs = (data.results || []).filter((job) => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location?.display_name || ''}`
    return remoteTerms.test(text)
  }).map((job) => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location?.display_name || ''}`
    return { ...normalizeAdzunaJob(job, country), nigeriaBased: nigeriaEligibleTerms.test(text) }
  })
  return storeJobs(jobs, 'Adzuna')
}

export async function syncAllJobSources() {
  const sourceNames = ['Remotive', 'Jobicy', 'JobsCollider', 'Remote OK', 'Arbeitnow', 'JobsCollider Nigeria', 'jobdataAPI Nigeria', 'Adzuna']
  const settled = await Promise.allSettled([syncRemotiveJobs(), syncJobicyJobs(), syncJobsColliderJobs(), syncRemoteOkJobs(), syncArbeitnowJobs(), syncNigeriaJobs(), syncJobdataNigeriaJobs(), syncAdzunaJobs()])
  const sources = settled.map((result, index) => result.status === 'fulfilled' ? result.value : { source: sourceNames[index], error: result.reason.message })
  return {
    sources,
    fetched: sources.reduce((sum, source) => sum + (source.fetched || 0), 0),
    stored: sources.reduce((sum, source) => sum + (source.stored || 0), 0),
    updated: sources.reduce((sum, source) => sum + (source.updated || 0), 0),
  }
}

async function acquireSyncLock() {
  const now = new Date()
  const lockToken = crypto.randomBytes(18).toString('base64url')
  try {
    const state = await JobSyncState.findOneAndUpdate(
      {
        _id: 'global',
        $and: [
          { $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] },
          { $or: [{ lastCompletedAt: { $exists: false } }, { lastCompletedAt: { $lte: new Date(now.getTime() - SYNC_COOLDOWN_MS) } }] },
        ],
      },
      { $set: { lockToken, lockedUntil: new Date(now.getTime() + SYNC_LOCK_MS), startedAt: now }, $unset: { lastError: 1 } },
      { upsert: true, returnDocument: 'after' },
    )
    return { state, lockToken }
  } catch (error) {
    if (error?.code !== 11000) throw error
    const state = await JobSyncState.findById('global').lean()
    const availableAt = state?.lockedUntil > now ? state.lockedUntil : new Date(new Date(state?.lastCompletedAt || now).getTime() + SYNC_COOLDOWN_MS)
    const retryAfter = Math.max(1, Math.ceil((availableAt.getTime() - now.getTime()) / 1000))
    const message = state?.lockedUntil > now ? 'A job refresh is already running. Please wait for it to finish.' : 'Jobs were refreshed recently. Please wait a few minutes before refreshing again.'
    throw Object.assign(new Error(message), { statusCode: 429, retryAfter })
  }
}

export async function syncJobsSafely() {
  const { lockToken } = await acquireSyncLock()
  try {
    const result = await syncAllJobSources()
    await JobSyncState.updateOne({ _id: 'global', lockToken }, { $set: { lastCompletedAt: new Date(), lockedUntil: new Date() }, $unset: { lockToken: 1, lastError: 1 } })
    return result
  } catch (error) {
    await JobSyncState.updateOne({ _id: 'global', lockToken }, { $set: { lockedUntil: new Date(), lastError: String(error.message || error).slice(0, 500) }, $unset: { lockToken: 1 } }).catch(() => {})
    throw error
  }
}
