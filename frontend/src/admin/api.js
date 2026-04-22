import axios from 'axios'

const ADMIN_API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 30000,
})

ADMIN_API.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminLogin = (email, password) => {
  const form = new FormData()
  form.append('username', email)
  form.append('password', password)
  return ADMIN_API.post('/admin/login', form)
}

export const adminGetStats       = ()           => ADMIN_API.get('/admin/stats')
export const adminGetJobs        = (page)       => ADMIN_API.get('/admin/jobs', { params: { page } })
export const adminCreateJob      = (data)       => ADMIN_API.post('/admin/jobs', data)
export const adminUpdateJob      = (id, data)   => ADMIN_API.put(`/admin/jobs/${id}`, data)
export const adminDeleteJob      = (id)         => ADMIN_API.delete(`/admin/jobs/${id}`)
export const adminGetEmployers   = ()           => ADMIN_API.get('/admin/employers')
export const adminCreateEmployer = (data)       => ADMIN_API.post('/admin/employers', data)
export const adminDeleteEmployer = (id)         => ADMIN_API.delete(`/admin/employers/${id}`)
export const adminGetApps        = (page)       => ADMIN_API.get('/admin/applications', { params: { page } })
export const adminDeleteApp      = (id)         => ADMIN_API.delete(`/admin/applications/${id}`)
export const adminParseJD        = (rawText)    => ADMIN_API.post('/admin/jobs/parse-jd', { raw_text: rawText })