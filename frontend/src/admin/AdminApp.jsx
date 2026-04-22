import { useState, useEffect } from 'react'
import {
  adminLogin, adminGetStats, adminGetJobs,
  adminCreateJob, adminUpdateJob, adminDeleteJob,
  adminGetEmployers, adminCreateEmployer, adminDeleteEmployer,
  adminGetApps, adminDeleteApp, adminParseJD
} from './api'

// ── Login Screen ─────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email,    setEmail]    = useState('admin@cvmatching.com')
  const [password, setPassword] = useState('admin123')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const res = await adminLogin(email, password)
      localStorage.setItem('admin_token', res.data.access_token)
      onLogin()
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center
                          justify-center text-white font-medium text-xs">A</div>
          <span className="font-medium text-gray-800">Admin Panel</span>
        </div>
        <div className="space-y-3 mb-4">
          <input type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 text-sm border border-gray-200
                       rounded-lg focus:outline-none focus:border-blue-400"/>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 text-sm border border-gray-200
                       rounded-lg focus:outline-none focus:border-blue-400"/>
        </div>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium
                     rounded-lg hover:bg-blue-800 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-medium ${color}`}>{value}</p>
  </div>
)

// ── Dashboard ─────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminGetStats().then(r => setStats(r.data))
  }, [])

  if (!stats) return (
    <div className="text-sm text-gray-400 py-8 text-center">Loading...</div>
  )

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-800 mb-5">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Job Descriptions" value={stats.total_jds}
                  color="text-blue-600"/>
        <StatCard label="CVs uploaded"     value={stats.total_cvs}
                  color="text-purple-600"/>
        <StatCard label="Applications"     value={stats.total_applications}
                  color="text-green-600"/>
        <StatCard label="Employers"        value={stats.total_employers}
                  color="text-yellow-600"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Applications by status
          </p>
          <div className="space-y-2">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status}
                className="flex items-center justify-between text-sm">
                <span className="text-gray-500 capitalize">{status}</span>
                <span className="font-medium text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg score */}
        <div className="bg-white rounded-xl border border-gray-200 p-5
                        flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 mb-2">Average match score</p>
          <p className="text-5xl font-medium text-blue-600">
            {stats.avg_match_score}%
          </p>
          <p className="text-xs text-gray-400 mt-2">across all applications</p>
        </div>
      </div>
    </div>
  )
}

// ── Jobs Manager ──────────────────────────────────────────
const JobsManager = () => {
  const [jobs,       setJobs]       = useState([])
  const [employers,  setEmployers]  = useState([])
  const [page,       setPage]       = useState(1)
  const [pages,      setPages]      = useState(1)
  const [showForm,   setShowForm]   = useState(false)
  const [editJob,    setEditJob]    = useState(null)
  const [form,       setForm]       = useState({
    title:'', description:'', requirements:'', employer_id:''
  })
  const [showParser, setShowParser] = useState(false)
  const [rawText,    setRawText]    = useState('')
  const [parsing,    setParsing]    = useState(false)
  const [parseMsg,   setParseMsg]   = useState('')

  const load = () => {
    adminGetJobs(page).then(r => {
      setJobs(r.data.jobs)
      setPages(r.data.pages)
    })
    adminGetEmployers().then(r => setEmployers(r.data))
  }

  useEffect(() => { load() }, [page])

  const handleSubmit = async () => {
    try {
      if (editJob) {
        await adminUpdateJob(editJob.id, form)
      } else {
        await adminCreateJob(form)
      }
      setShowForm(false); setEditJob(null)
      setForm({ title:'', description:'', requirements:'', employer_id:'' })
      load()
    } catch { alert('Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return
    await adminDeleteJob(id); load()
  }

  const handleEdit = (job) => {
    setEditJob(job)
    setForm({
      title       : job.title,
      description : job.description,
      requirements: job.requirements,
      employer_id : job.employer_id || ''
    })
    setShowForm(true)
  }

  const handleParse = async () => {
    if (!rawText.trim()) return
    setParsing(true); setParseMsg('')
    try {
      const res = await adminParseJD(rawText)
      const parsed = res.data
      setForm(prev => ({
        ...prev,
        title       : parsed.title        || prev.title,
        description : parsed.description  || prev.description,
        requirements: parsed.requirements || prev.requirements,
      }))
      setShowParser(false)
      setRawText('')
      setParseMsg('Fields filled from parsed text — review and adjust before saving.')
    } catch {
      setParseMsg('Parse failed. Check the text and try again.')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium text-gray-800">Job Descriptions</h2>
        <button onClick={() => {
            setShowForm(true); setEditJob(null)
            setShowParser(false); setRawText(''); setParseMsg('')
            setForm({ title:'', description:'', requirements:'', employer_id:'' })
          }}
          className="text-xs px-4 py-2 bg-blue-700 text-white rounded-lg
                     hover:bg-blue-800">
          + Add Job
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              {editJob ? 'Edit Job' : 'New Job'}
            </h3>
            {!editJob && (
              <button onClick={() => { setShowParser(p => !p); setParseMsg('') }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                  ${showParser
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                Auto-parse from text
              </button>
            )}
          </div>

          {/* Parser panel */}
          {showParser && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">
                Paste full JD text — headings (Mô tả / Requirements / etc.) are detected automatically
              </p>
              <p className="text-xs text-blue-500 mb-3">
                Fields below will be filled after parsing. You can review and edit before saving.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={"Ví dụ:\nVị trí: Senior Backend Engineer\n\nMô tả công việc\n- Xây dựng REST API...\n\nYêu cầu ứng viên\n- 3+ năm kinh nghiệm Python..."}
                rows={10}
                className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg
                           focus:outline-none focus:border-blue-400 bg-white resize-y
                           font-mono leading-relaxed"/>
              <div className="flex gap-2 mt-3">
                <button onClick={handleParse}
                  disabled={parsing || !rawText.trim()}
                  className="px-4 py-2 bg-blue-700 text-white text-xs rounded-lg
                             hover:bg-blue-800 disabled:opacity-50 font-medium">
                  {parsing ? 'Parsing...' : 'Parse & fill fields'}
                </button>
                <button onClick={() => { setShowParser(false); setRawText(''); setParseMsg('') }}
                  className="px-3 py-2 border border-blue-200 text-xs rounded-lg
                             text-blue-600 hover:bg-blue-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Parse result notice */}
          {parseMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-3
              ${parseMsg.includes('failed')
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-green-50 text-green-700 border border-green-100'}`}>
              {parseMsg}
            </div>
          )}

          <div className="space-y-3">
            <input value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Job title"
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
            <textarea value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Job description" rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
            <textarea value={form.requirements}
              onChange={e => setForm({...form, requirements: e.target.value})}
              placeholder="Requirements (comma separated)" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
            <select value={form.employer_id}
              onChange={e => setForm({...form, employer_id: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400">
              <option value="">Select employer</option>
              {employers.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit}
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg
                         hover:bg-blue-800">
              {editJob ? 'Update' : 'Create'}
            </button>
            <button onClick={() => {
                setShowForm(false); setEditJob(null)
                setShowParser(false); setRawText(''); setParseMsg('')
              }}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg
                         hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500 hidden md:table-cell">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Created</th>
              <th className="px-4 py-3"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 text-xs">
                  {job.title}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs
                               hidden md:table-cell max-w-xs truncate">
                  {job.description}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(job.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(job)}
                      className="text-xs px-2.5 py-1 rounded border
                                 border-gray-200 hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(job.id)}
                      className="text-xs px-2.5 py-1 rounded border
                                 border-red-100 text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page}/{pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))}
                disabled={page===1}
                className="text-xs px-3 py-1 border border-gray-200 rounded
                           hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pages,p+1))}
                disabled={page===pages}
                className="text-xs px-3 py-1 border border-gray-200 rounded
                           hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Employers Manager ─────────────────────────────────────
const EmployersManager = () => {
  const [employers, setEmployers] = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [form, setForm] = useState({name:'', email:'', company_info:''})

  const load = () => adminGetEmployers().then(r => setEmployers(r.data))
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    try {
      await adminCreateEmployer(form)
      setShowForm(false)
      setForm({name:'', email:'', company_info:''})
      load()
    } catch { alert('Failed to create') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete employer?')) return
    await adminDeleteEmployer(id); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium text-gray-800">Employers</h2>
        <button onClick={() => setShowForm(true)}
          className="text-xs px-4 py-2 bg-blue-700 text-white rounded-lg
                     hover:bg-blue-800">
          + Add Employer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            New Employer
          </h3>
          <div className="space-y-3">
            <input value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Company name"
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
            <input value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="Contact email"
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
            <textarea value={form.company_info}
              onChange={e => setForm({...form, company_info: e.target.value})}
              placeholder="Company description" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200
                         rounded-lg focus:outline-none focus:border-blue-400"/>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit}
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg
                         hover:bg-blue-800">
              Create
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg
                         hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Email</th>
              <th className="px-4 py-3"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employers.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 text-xs">
                  {emp.name}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{emp.email}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(emp.id)}
                    className="text-xs px-2.5 py-1 rounded border border-red-100
                               text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Applications Manager ──────────────────────────────────
const ApplicationsManager = () => {
  const [apps,  setApps]  = useState([])
  const [page,  setPage]  = useState(1)
  const [pages, setPages] = useState(1)

  const STATUS_COLOR = {
    pending  : 'bg-gray-100 text-gray-600',
    sent     : 'bg-blue-50 text-blue-700',
    viewed   : 'bg-purple-50 text-purple-700',
    interview: 'bg-yellow-50 text-yellow-700',
    accepted : 'bg-green-50 text-green-700',
    rejected : 'bg-red-50 text-red-500',
  }

  const load = () => {
    adminGetApps(page).then(r => {
      setApps(r.data.applications)
      setPages(r.data.pages)
    })
  }
  useEffect(() => { load() }, [page])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete application?')) return
    await adminDeleteApp(id); load()
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-800 mb-5">Applications</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">CV File</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Job</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500">Date</th>
              <th className="px-4 py-3"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apps.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-600 max-w-32 truncate">
                  {app.cv_file}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-800
                               max-w-40 truncate">
                  {app.job_title}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-blue-600">
                  {app.score}%
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${STATUS_COLOR[app.status] || STATUS_COLOR.pending}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(app.id)}
                    className="text-xs px-2.5 py-1 rounded border border-red-100
                               text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page}/{pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))}
                disabled={page===1}
                className="text-xs px-3 py-1 border border-gray-200 rounded
                           hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pages,p+1))}
                disabled={page===pages}
                className="text-xs px-3 py-1 border border-gray-200 rounded
                           hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Admin App ────────────────────────────────────────
export default function AdminApp() {
  const [authed,  setAuthed]  = useState(!!localStorage.getItem('admin_token'))
  const [tab,     setTab]     = useState('dashboard')

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setAuthed(false)
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)}/>

  const NAV = [
    { id: 'dashboard',    label: 'Dashboard'    },
    { id: 'jobs',         label: 'Jobs'         },
    { id: 'employers',    label: 'Employers'    },
    { id: 'applications', label: 'Applications' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-48 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center
                            justify-center text-white font-medium text-xs">A</div>
            <span className="text-sm font-medium text-gray-800">Admin</span>
          </div>
        </div>
        <nav className="p-2">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm
                          transition-colors mb-0.5
                ${tab === n.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'}`}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 w-48 px-2">
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm
                       text-red-500 hover:bg-red-50 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm text-gray-400">
            CV Matching System /{' '}
            <span className="text-gray-700 font-medium capitalize">{tab}</span>
          </h1>
          <a href="/" className="text-xs text-blue-600 hover:underline">
            ← Back to app
          </a>
        </div>

        {tab === 'dashboard'    && <Dashboard/>}
        {tab === 'jobs'         && <JobsManager/>}
        {tab === 'employers'    && <EmployersManager/>}
        {tab === 'applications' && <ApplicationsManager/>}
      </main>
    </div>
  )
}