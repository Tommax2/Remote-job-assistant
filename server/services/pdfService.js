import PDFDocument from 'pdfkit'
import { PassThrough } from 'node:stream'

const value = (...values) => values.filter(Boolean).join(' · ')
function section(doc, title) { doc.moveDown(.7).font('Helvetica-Bold').fontSize(11).fillColor('#174c3d').text(title.toUpperCase()).moveDown(.3).fillColor('#17251f') }
function description(doc, content) { if (content) doc.font('Helvetica').fontSize(9.5).fillColor('#394740').text(String(content), { lineGap: 2 }) }

export function renderResumePdf(resume, profile, job, output) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `${profile.fullName} - ${job.title}` } })
  doc.pipe(output)
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#123c32').text(profile.fullName)
  doc.font('Helvetica').fontSize(11).fillColor('#52605a').text(resume.professionalTitle || profile.professionalTitle)
  doc.fontSize(8.5).text(value(profile.email, profile.phone, profile.location)).text(value(profile.portfolio?.linkedin, profile.portfolio?.github, profile.portfolio?.website))
  if (resume.professionalSummary) { section(doc, 'Professional summary'); description(doc, resume.professionalSummary) }
  if (resume.skills?.length) { section(doc, 'Core skills'); description(doc, resume.skills.join('  •  ')) }
  if (resume.experience?.length) { section(doc, 'Experience'); resume.experience.forEach((item) => { doc.font('Helvetica-Bold').fontSize(10).text(value(item.jobTitle || item.title, item.company)); doc.font('Helvetica').fontSize(8.5).fillColor('#68756f').text(value(item.location, item.startDate, item.current ? 'Present' : item.endDate)); description(doc, item.description || item.highlights); doc.moveDown(.4) }) }
  if (resume.projects?.length) { section(doc, 'Projects'); resume.projects.forEach((item) => { doc.font('Helvetica-Bold').fontSize(10).text(item.name || item.title || 'Project'); description(doc, value(item.description, (item.technologies || []).join(', '))); doc.moveDown(.35) }) }
  if (resume.education?.length) { section(doc, 'Education'); resume.education.forEach((item) => { doc.font('Helvetica-Bold').fontSize(10).text(value(item.degree, item.fieldOfStudy)); description(doc, value(item.school, item.startDate, item.endDate)) }) }
  doc.end()
}

export function createResumePdfBuffer(resume, profile, job) {
  return new Promise((resolve, reject) => { const stream = new PassThrough(); const chunks = []; stream.on('data', (chunk) => chunks.push(chunk)); stream.on('end', () => resolve(Buffer.concat(chunks))); stream.on('error', reject); renderResumePdf(resume, profile, job, stream) })
}
