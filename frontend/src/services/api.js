import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 60000,
})

// ── CV ───────────────────────────────────────────────────
export const uploadCV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return API.post('/cv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getCV = (cvId) =>
  API.get(`/cv/${cvId}`)

export const getAllCVs = () =>
  API.get('/cv/all')

export const deleteCV = (cvId) =>
  API.delete(`/cv/${cvId}`)

// ── Jobs ─────────────────────────────────────────────────
export const matchJobs = (cvId, topK = 10) =>
  API.get('/jobs/match', { params: { cv_id: cvId, top_k: topK } })

export const getJob = (jdId) =>
  API.get(`/jobs/${jdId}`)

export const getAllJobs = (page = 1, limit = 20) =>
  API.get('/jobs/all', { params: { page, limit } })

export const analyzeJob = (jdId, cvId, language = 'vi') =>
  API.post(`/jobs/${jdId}/analyze`, null, { params: { cv_id: cvId, language } })

// ── Remote Jobs ───────────────────────────────────────────
export const matchRemoteJobs = (cvId, country = null) =>
  API.post('/remote-jobs/match', { cv_id: cvId, country })

export const getRemoteCountries = () =>
  API.get('/remote-jobs/countries')

export const analyzeRemoteJob = (cvId, job, language = 'en') =>
  API.post('/remote-jobs/analyze', {
    cv_id            : cvId,
    position         : job.position,
    description_clean: job.description_clean,
    tags             : job.tags || [],
    score            : job.score,
    language,
  })

// ── Applications ─────────────────────────────────────────
export const applyJob = (jdId, cvId) =>
  API.post(`/applications/${jdId}/apply`, null, { params: { cv_id: cvId } })

export const applyWithEmail = (body) =>
  API.post('/applications', body)

export const getApplicationHistory = (cvId) =>
  API.get(`/applications/history/${cvId}`)

export const updateApplicationStatus = (applicationId, status) =>
  API.patch(`/applications/${applicationId}/status`, null, { params: { status } })

// ── Auth ─────────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  API.post('/auth/register', { name, email, password })

export const loginUser = (email, password) =>
  API.post('/auth/login', { email, password })
