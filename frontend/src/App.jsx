import { useState, useCallback, useEffect } from 'react'
import { uploadCV, matchJobs, analyzeJob, applyJob,
         getCV, getAllJobs, getAllCVs, deleteCV,
         getApplicationHistory,
         updateApplicationStatus } from './services/api'


const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
)
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24"
    fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const TrendIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

// ── Step Indicator ───────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ['Upload CV', 'Results', 'Analysis']
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center
              text-xs font-medium transition-colors
              ${i < current  ? 'bg-green-700 text-white'
              : i === current ? 'bg-blue-700 text-white'
              :                 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
              {i < current ? <CheckIcon size={10}/> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block
              ${i === current ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1
              ${i < current ? 'bg-green-400' : 'bg-gray-200'}`}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Upload Screen ────────────────────────────────────────
import { useDropzone } from 'react-dropzone'

const UploadScreen = ({ onSuccess, cvData, onSelectCV }) => {
  const [status,   setStatus]   = useState('idle')
  const [filename, setFilename] = useState('')
  const [error,    setError]    = useState('')

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setFilename(file.name)
    setStatus('uploading')
    setError('')
    try {
      const res = await uploadCV(file)
      setStatus('success')
      setTimeout(() => onSuccess(res.data), 800)
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.detail || 'Upload failed, please try again!')
    }
  }, [onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: status === 'uploading'
  })

return (
    <div>
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
        className="relative overflow-hidden">

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize : '40px 40px'
          }}/>
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#3b82f6', filter: 'blur(60px)' }}/>
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: '#6366f1', filter: 'blur(50px)' }}/>

        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5
                              rounded-full border border-blue-400
                              border-opacity-40 bg-blue-500 bg-opacity-10 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                <span className="text-xs text-blue-300 font-medium">
                  AI-Powered Career Matching
                </span>
              </div>
              <h1 className="text-4xl font-medium text-white leading-tight mb-4">
                Find your{' '}
                <span style={{ color: '#60a5fa' }}>perfect job</span>
                <br/>with AI precision
              </h1>
              <p className="text-base text-gray-300 leading-relaxed mb-8">
                Upload your CV and our fine-tuned SBERT model instantly
                matches you with the most relevant opportunities — ranked
                by semantic similarity, not just keywords.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '10+', label: 'Job categories' },
                  { value: '99%', label: 'Accuracy'       },
                  { value: '<3s', label: 'Matching speed' },
                ].map((s, i) => (
                  <div key={i}
                    className="rounded-xl p-4 border border-white border-opacity-10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-2xl font-medium text-white mb-0.5">
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — upload card */}
            <div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 flex
                                  items-center justify-center text-white
                                  font-medium text-sm">
                    CV
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Upload your CV
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF or DOCX · Max 10MB
                    </p>
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center
                    cursor-pointer transition-all duration-150
                    ${isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : status === 'uploading'
                      ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                      : status === 'success'
                      ? 'border-green-400 bg-green-50'
                      : status === 'error'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
                >
                  <input {...getInputProps()}/>

                  {status === 'idle' && (
                    <>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex
                                      items-center justify-center mx-auto mb-3
                                      text-blue-600">
                        <UploadIcon/>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {isDragActive ? 'Drop it here...' : 'Drag & drop your CV'}
                      </p>
                      <p className="text-xs text-gray-400">or click to browse</p>
                    </>
                  )}

                  {status === 'uploading' && (
                    <>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex
                                      items-center justify-center mx-auto mb-3
                                      text-blue-600">
                        <SpinnerIcon/>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Processing{' '}
                        <span className="text-blue-600">{filename}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Extracting text & generating embeddings...
                      </p>
                      <div className="mt-4 h-1 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full
                                        animate-pulse w-2/3"/>
                      </div>
                    </>
                  )}

                  {status === 'success' && (
                    <>
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex
                                      items-center justify-center mx-auto mb-3
                                      text-green-600">
                        <CheckIcon size={20}/>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Upload successful!
                      </p>
                      <p className="text-xs text-gray-400 flex items-center
                                    justify-center gap-1">
                        <FileIcon/> {filename}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Finding matching jobs...
                      </p>
                    </>
                  )}

                  {status === 'error' && (
                    <>
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex
                                      items-center justify-center mx-auto mb-3
                                      text-red-500">
                        <AlertIcon/>
                      </div>
                      <p className="text-sm font-medium text-red-600 mb-1">
                        Upload failed!
                      </p>
                      <p className="text-xs text-red-400 mb-2">{error}</p>
                      <p className="text-xs text-gray-400">Click to try again</p>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    'Extracts text from scanned PDFs via OCR',
                    'Fine-tuned SBERT for semantic matching',
                    'GPT-powered CV analysis & recommendations',
                  ].map((t, i) => (
                    <div key={i}
                      className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 rounded-full bg-green-50 flex
                                      items-center justify-center flex-shrink-0
                                      text-green-600">
                        <CheckIcon size={9}/>
                      </div>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── How it works + CV Library ── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* How it works — 2/3 width */}
          <div className="lg:col-span-2">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-widest mb-5">
              How it works
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step : '01',
                  color: 'bg-blue-50 text-blue-700',
                  title: 'Upload your CV',
                  desc : 'Drop your PDF or DOCX. OCR engine extracts every detail — even from scanned documents.',
                },
                {
                  step : '02',
                  color: 'bg-purple-50 text-purple-700',
                  title: 'AI matching',
                  desc : 'Fine-tuned SBERT encodes your CV into a 768-dim vector and compares against every job.',
                },
                {
                  step : '03',
                  color: 'bg-green-50 text-green-700',
                  title: 'Get insights',
                  desc : 'Ranked Top-10 with match scores, strengths, skill gaps and AI-powered recommendations.',
                },
              ].map((item, i) => (
                <div key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`w-8 h-8 rounded-lg ${item.color} flex
                                  items-center justify-center text-xs
                                  font-medium mb-3`}>
                    {item.step}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CV Library — 1/3 width */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200
                            overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100
                              flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  Saved CVs
                </p>
                <span className="text-xs text-gray-400">
                  Reuse previous uploads
                </span>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                <CVLibrary
                  onSelectCV={onSelectCV}
                  currentCvId={cvData?.id}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── CV Preview ───────────────────────────────────────────
const CVPreview = ({ cvData }) => {
  const [expanded, setExpanded] = useState(false)
  const [cvText,   setCvText]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
  if (!cvData?.id) return
  getCV(cvData.id)
    .then(res => {
      setCvText(res.data?.raw_text || '')
    })
    .catch(err => {
      console.error('getCV error:', err)
      setCvText('')
    })
    .finally(() => setLoading(false))
}, [cvData?.id])

  const preview = cvText.slice(0, 300)
  const hasMore = cvText.length > 300

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5
                      border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center
                          justify-center text-blue-600">
            <FileIcon/>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-none">
              {cvData?.filename}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {cvText.length > 0
                ? `${cvText.length.toLocaleString()} characters`
                : 'Loading...'}
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-50
                         text-green-700 font-medium border border-green-100">
          ✓ Processed
        </span>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <SpinnerIcon/> Loading CV content...
          </div>
        ) : cvText ? (
          <>
            <pre className={`text-xs text-gray-600 whitespace-pre-wrap
                             font-sans leading-relaxed
                             ${!expanded ? 'line-clamp-6' : ''}`}>
              {expanded ? cvText : preview}
              {!expanded && hasMore && '...'}
            </pre>
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 text-xs text-blue-600 hover:underline
                           flex items-center gap-1"
              >
                {expanded
                  ? '▲ Collapse'
                  : `▼ View full content (${cvText.length.toLocaleString()} characters)`}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 py-2">
            Could not read CV content
          </p>
        )}
      </div>
    </div>
  )
}

// ── Job Card ─────────────────────────────────────────────
const JobCard = ({ job, rank, onClick, active }) => {
  const pct = Math.round((job?.score || 0) * 100) 
  const labelCfg = {
    'Good Fit'     : { cls: 'bg-green-50 text-green-700',   Icon: StarIcon  },
    'Potential Fit': { cls: 'bg-yellow-50 text-yellow-700', Icon: TrendIcon },
    'No Fit'       : { cls: 'bg-red-50 text-red-500',       Icon: null      },
  }
  const cfg  = labelCfg[job.label] || labelCfg['No Fit']
  const Icon = cfg.Icon

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all
        duration-150 hover:shadow-sm hover:-translate-y-px
        ${active
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center
                          justify-center text-blue-700 font-medium text-sm
                          flex-shrink-0">
            #{rank}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-snug">
              {job.title}
            </p>
            <span className={`inline-flex items-center gap-1 text-xs
                              px-2 py-0.5 rounded-full mt-1 font-medium
                              ${cfg.cls}`}>
              {Icon && <Icon/>} {job.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-medium
            ${pct >= 70 ? 'text-green-600'
            : pct >= 40 ? 'text-yellow-600'
            : 'text-red-400'}`}>
            {pct}%
          </div>
          <div className="text-xs text-gray-400">match</div>
        </div>
      </div>

      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${pct >= 70 ? 'bg-green-500'
            : pct >= 40 ? 'bg-yellow-400'
            : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
        {job.description}
      </p>
    </div>
  )
}

// ── Results Screen ───────────────────────────────────────
const ResultsScreen = ({ cvData, jobs, onSelectJob, onReset }) => (
  <div className="max-w-5xl mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-xl font-medium text-gray-800">
          Top {jobs.length} matching jobs
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Based on AI analysis of your CV
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-blue-600 hover:underline"
      >
        Upload another CV
      </button>
    </div>

    <CVPreview cvData={cvData}/>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {jobs.map((job, i) => (
        <JobCard
          key={job.id}
          job={job}
          rank={i + 1}
          onClick={() => onSelectJob(job)}
        />
      ))}
    </div>
  </div>
)

// ── Analysis Panel ───────────────────────────────────────
const AnalysisPanel = ({ job, cvId }) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied,  setApplied]  = useState(false)
  const [showReq,  setShowReq]  = useState(false)
  const [error,    setError]    = useState('')

  const handleAnalyze = async () => {
  setLoading(true); setError('')
  try {
    const res = await analyzeJob(job.id, cvId)
    setAnalysis(res.data)
  } catch(err) {
    console.error(err)
    setError('Analysis failed, please try again!')
  } finally {
    setLoading(false)
  }
}

  const handleApply = async () => {
    setApplying(true)
    try {
      await applyJob(job.id, cvId)
      setApplied(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Application failed!')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-medium text-gray-800">{job.title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Match score:{' '}
          <span className="font-medium text-blue-600">
            {Math.round(job.score * 100)}%
          </span>
          {' · '}
          <span className={`font-medium
            ${job.label === 'Good Fit'      ? 'text-green-600'
            : job.label === 'Potential Fit' ? 'text-yellow-600'
            : 'text-red-500'}`}>
            {job.label}
          </span>
        </p>
      </div>

      <p className="text-sm text-gray-500 mb-3">{job.description}</p>

      <button
        onClick={() => setShowReq(!showReq)}
        className="text-xs text-blue-500 hover:underline mb-4 block"
      >
        {showReq ? '▲ Hide requirements' : '▼ View requirements'}
      </button>
      {showReq && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
          {job.requirements}
        </div>
      )}

      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-blue-700 text-white
                     text-sm font-medium hover:bg-blue-800 disabled:opacity-50
                     transition-colors flex items-center justify-center gap-2"
        >
          {loading
            ? <><SpinnerIcon/> Analyzing...</>
            : '🔍 Analyze CV vs JD'}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}

      {analysis && (
        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">
              {analysis.overall_assessment}
            </p>
          </div>

          {analysis.strengths?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center
                            gap-1.5 mb-2">
                <span className="text-green-600"><CheckIcon size={14}/></span>
                Strengths
              </p>
              <div className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="font-medium text-green-700 min-w-fit">
                      {s.skill}:
                    </span>
                    <span className="text-gray-500">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.missing_skills?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center
                            gap-1.5 mb-2">
                <span className="text-yellow-500"><AlertIcon/></span>
                Skills to improve
              </p>
              <div className="space-y-2">
                {analysis.missing_skills.map((s, i) => (
                  <div key={i}
                    className="p-2.5 bg-yellow-50 rounded-lg border
                               border-yellow-100 text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-yellow-800">
                        {s.skill}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                        ${s.importance === 'high'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {s.importance}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                💡 Recommendations
              </p>
              <ul className="space-y-1">
                {analysis.recommendations.map((r, i) => (
                  <li key={i}
                    className="text-sm text-gray-500 flex gap-2 leading-relaxed">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`w-full py-2.5 rounded-full text-sm font-medium
                        transition-colors flex items-center justify-center gap-2
              ${applied
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-green-700 text-white hover:bg-green-800 disabled:opacity-50'}`}
          >
            {applied   ? <><CheckIcon size={14}/> Applied!</>
            : applying ? <><SpinnerIcon/> Submitting...</>
            :             <><SendIcon/> Apply now</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Analysis Screen ──────────────────────────────────────
const AnalysisScreen = ({ cvData, jobs, selectedJob, onSelectJob, onBack }) => (
  <div className="min-h-screen" style={{ background: '#f8fafc' }}>

    {/* Back button */}
    <div className="max-w-4xl mx-auto px-6 pt-6 pb-2">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-800 flex items-center
                   gap-1.5 transition-colors"
      >
        <BackIcon/> Back to results
      </button>
    </div>

    <div className="max-w-4xl mx-auto px-6 pb-12">

      {/* Job header card */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>

        {/* Decorative grid */}
        <div className="absolute opacity-5 inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize : '32px 32px'
          }}/>

        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {/* Rank badge */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#93c5fd' }}>
                  #{jobs.findIndex(j => j.id === selectedJob.id) + 1} in your matches
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium
                  ${selectedJob.label === 'Good Fit'
                    ? 'bg-green-500 bg-opacity-20 text-green-300'
                    : selectedJob.label === 'Potential Fit'
                    ? 'bg-yellow-500 bg-opacity-20 text-yellow-300'
                    : 'bg-red-500 bg-opacity-20 text-red-300'}`}>
                  {selectedJob.label}
                </span>
              </div>

              <h1 className="text-3xl font-medium text-white mb-3">
                {selectedJob.title}
              </h1>

              <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
                {selectedJob.description}
              </p>
            </div>

            {/* Score circle */}
            <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className={`text-5xl font-medium mb-1
                ${Math.round(selectedJob.score*100) >= 70 ? 'text-green-400'
                : Math.round(selectedJob.score*100) >= 40 ? 'text-yellow-400'
                : 'text-red-400'}`}>
                {Math.round(selectedJob.score * 100)}%
              </div>
              <div className="text-xs text-gray-400">match score</div>
              {/* Mini bar */}
              <div className="mt-3 w-20 h-1 bg-white bg-opacity-10 rounded-full
                              overflow-hidden mx-auto">
                <div className={`h-full rounded-full
                  ${Math.round(selectedJob.score*100) >= 70 ? 'bg-green-400'
                  : Math.round(selectedJob.score*100) >= 40 ? 'bg-yellow-400'
                  : 'bg-red-400'}`}
                  style={{ width: `${Math.round(selectedJob.score*100)}%` }}/>
              </div>
            </div>
          </div>

          {/* Requirements chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {selectedJob.requirements.split(',').slice(0, 8).map((req, i) => (
              <span key={i}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                {req.trim().split('.')[0].trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2 col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — Analysis (3/5) */}
        <div className="lg:col-span-3">
          <AnalysisPanel job={selectedJob} cvId={cvData?.id}/>
        </div>

        {/* Right — Other matches (2/5) */}
        {/* Right — Ad banner (2/5) */}
<div className="lg:col-span-2 space-y-4">

  {/* Banner 1 — AI tip */}
  <div className="rounded-2xl overflow-hidden border border-gray-200"
    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
    <div className="p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full
                      mb-4"
        style={{ background: 'rgba(96,165,250,0.15)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
        <span className="text-xs text-blue-300 font-medium">Pro tip</span>
      </div>
      <h3 className="text-base font-medium text-white mb-2">
        Boost your match score
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed mb-4">
        Tailor your CV keywords to match the job requirements.
        Candidates who do this see up to <span className="text-blue-300
        font-medium">40% higher</span> match scores.
      </p>
      <div className="space-y-2">
        {[
          'Use exact keywords from the JD',
          'Quantify your achievements',
          'Add missing skills to projects',
        ].map((tip, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
            <div className="w-4 h-4 rounded-full flex items-center justify-center
                            flex-shrink-0"
              style={{ background: 'rgba(96,165,250,0.2)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="#60a5fa" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            {tip}
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Banner 2 — Stats */}
  <div className="rounded-2xl border border-gray-200 bg-white p-5">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest
                  mb-4">
      Why CV Matching?
    </p>
    <div className="space-y-4">
      {[
        { value: '6,241', label: 'CVs analyzed',       color: 'text-blue-600'   },
        { value: '99.6%', label: 'Model accuracy',     color: 'text-green-600'  },
        { value: '768',   label: 'Embedding dimensions', color: 'text-purple-600' },
        { value: '<3s',   label: 'Average match time', color: 'text-yellow-600' },
      ].map((s, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{s.label}</span>
          <span className={`text-sm font-medium ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Banner 3 — CTA */}
  <div className="rounded-2xl border border-gray-200 overflow-hidden">
    <div className="p-5"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
      <h3 className="text-sm font-medium text-white mb-1.5">
        Ready to apply?
      </h3>
      <p className="text-xs text-green-200 leading-relaxed mb-4">
        Don't wait — top candidates apply within 24 hours of finding a match.
        Stand out by applying now.
      </p>
      <div className="flex items-center gap-2 text-xs text-green-300">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
        AI analysis completed · Ready to submit
      </div>
    </div>
  </div>

</div>
      </div>
    </div>
  </div>
)

// ── Loading Screen ───────────────────────────────────────
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <SpinnerIcon/>
    <p className="text-sm text-gray-500">Finding matching jobs...</p>
  </div>
)

// ── Application History ──────────────────────────────────
const STATUS_CONFIG = {
  pending  : { label: 'Pending',   cls: 'bg-gray-100 text-gray-600'    },
  sent     : { label: 'Sent',      cls: 'bg-blue-50 text-blue-700'     },
  viewed   : { label: 'Viewed',    cls: 'bg-purple-50 text-purple-700' },
  interview: { label: 'Interview', cls: 'bg-yellow-50 text-yellow-700' },
  accepted : { label: 'Accepted',  cls: 'bg-green-50 text-green-700'   },
  rejected : { label: 'Rejected',  cls: 'bg-red-50 text-red-500'       },
}

const ApplicationHistory = ({ cvId, onClose }) => {
  const [apps,    setApps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!cvId) return
    setLoading(true)
    getApplicationHistory(cvId)
      .then(res => setApps(res.data))
      .catch(()  => setError('Failed to load applications'))
      .finally(()=> setLoading(false))
  }, [cvId])

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus)
      setApps(prev => prev.map(a =>
        a.application_id === applicationId
          ? { ...a, status: newStatus }
          : a
      ))
    } catch {
      alert('Failed to update status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50
                    flex items-start justify-center pt-10 px-4 pb-4
                    overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200
                      w-full max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              Application history
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {apps.length} application{apps.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center
                       justify-center text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3
                            text-gray-400 text-sm">
              <SpinnerIcon/> Loading...
            </div>
          ) : error ? (
            <div className="text-center py-16 text-sm text-red-400">
              {error}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                No applications yet
              </p>
              <p className="text-xs text-gray-400">
                Upload your CV and start applying to jobs
              </p>
            </div>
          ) : (
            apps.map((app) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
              return (
                <div key={app.application_id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">

                    {/* Job info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-800">
                          {app.job.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {app.job.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          Applied {new Date(app.applied_at)
                            .toLocaleDateString('en-US', {
                              month: 'short',
                              day  : 'numeric',
                              year : 'numeric'
                            })}
                        </span>
                        {app.score && (
                          <span className="text-xs text-blue-600 font-medium">
                            {Math.round(app.score * 100)}% match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-end gap-2
                                    flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full
                                        font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>

                      {/* Status dropdown */}
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(
                          app.application_id, e.target.value
                        )}
                        className="text-xs border border-gray-200 rounded-lg
                                   px-2 py-1 text-gray-600 bg-white
                                   focus:outline-none focus:border-blue-400
                                   cursor-pointer"
                      >
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Requirements tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.job.requirements
                      .split(',')
                      .slice(0, 5)
                      .map((req, i) => (
                        <span key={i}
                          className="text-xs px-2 py-0.5 rounded-full
                                     bg-gray-100 text-gray-500">
                          {req.trim().split('.')[0].trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer stats */}
        {apps.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50
                          rounded-b-2xl">
            <div className="flex items-center gap-6">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = apps.filter(a => a.status === status).length
                if (count === 0) return null
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full
                                      font-medium ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ── Jobs Database Screen ─────────────────────────────────
const JobsDatabase = ({ onClose, cvData, onSelectJob }) => {
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    getAllJobs(page, 20)
      .then(res => {
        setJobs(res.data.jobs)
        setTotal(res.data.total)
        setPages(res.data.pages)
      })
      .finally(() => setLoading(false))
  }, [page])

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex
                    items-start justify-center pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 w-full
                      max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              Job Database
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} jobs available
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center
                       justify-center text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search jobs by title or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-4 py-2 rounded-lg border
                       border-gray-200 focus:outline-none focus:border-blue-400
                       bg-gray-50"
          />
        </div>

        {/* Job list */}
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3
                            text-gray-400">
              <SpinnerIcon/> Loading jobs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              No jobs found
            </div>
          ) : (
            filtered.map((job, i) => (
              <div key={job.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600
                                       bg-blue-50 px-2 py-0.5 rounded-full">
                        #{(page - 1) * 20 + i + 1}
                      </span>
                      <h3 className="text-sm font-medium text-gray-800
                                     truncate">
                        {job.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements
                        .split(',')
                        .slice(0, 4)
                        .map((req, j) => (
                          <span key={j}
                            className="text-xs px-2 py-0.5 rounded-full
                                       bg-gray-100 text-gray-500">
                            {req.trim().split('.')[0].trim()}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {cvData && (
                      <button
                        onClick={() => { onSelectJob(job); onClose() }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-700
                                   text-white hover:bg-blue-800 transition-colors
                                   whitespace-nowrap"
                      >
                        Analyze with CV
                      </button>
                    )}
                    <span className="text-xs text-gray-300 text-center">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3
                          border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                           hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                           hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ── CV Library (sidebar) ─────────────────────────────────
const CVLibrary = ({ onSelectCV, currentCvId }) => {
  const [cvs,      setCvs]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)  // ← thêm

  useEffect(() => {
    getAllCVs()
      .then(res => setCvs(res.data))
      .finally(()=> setLoading(false))
  }, [currentCvId])

  // ← Thêm hàm xóa
  const handleDelete = async (cv, e) => {
    e.stopPropagation()  // Không trigger click card
    if (!window.confirm(`Delete "${cv.filename}"?`)) return

    setDeleting(cv.id)
    try {
      await deleteCV(cv.id)
      setCvs(prev => prev.filter(c => c.id !== cv.id))
    } catch {
      alert('Failed to delete CV')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8 gap-2
                    text-gray-400 text-xs">
      <SpinnerIcon/> Loading...
    </div>
  )

  if (cvs.length === 0) return (
    <div className="text-center py-8 text-xs text-gray-400">
      No CVs uploaded yet
    </div>
  )

  return (
    <div className="space-y-2">
      {cvs.map(cv => {
        const isActive  = cv.id === currentCvId
        const isDeleting = deleting === cv.id
        const date = new Date(cv.uploaded_at)
          .toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })

        return (
          <div key={cv.id}
            className={`p-3 rounded-xl border-2 transition-all duration-150
              ${isActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'}`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center
                               justify-center flex-shrink-0 text-xs font-medium
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500'}`}>
                <FileIcon/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate
                               leading-tight mb-0.5">
                  {cv.filename}
                </p>
                <p className="text-xs text-gray-400">{date}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full
                    ${cv.has_text
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-400'}`}>
                    {cv.has_text ? '✓ Extracted' : '✗ No text'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2.5 flex gap-2">
              {isActive ? (
                <div className="flex-1 py-1.5 rounded-lg bg-blue-100
                                text-blue-700 text-xs font-medium text-center">
                  Currently active
                </div>
              ) : (
                <button
                  onClick={() => onSelectCV(cv)}
                  disabled={!cv.has_text || isDeleting}
                  className="flex-1 py-1.5 rounded-lg bg-blue-700 text-white
                             text-xs font-medium hover:bg-blue-800
                             disabled:opacity-40 transition-colors"
                >
                  Use this CV
                </button>
              )}

              {/* ← Nút xóa */}
              <button
                onClick={(e) => handleDelete(cv, e)}
                disabled={isDeleting}
                className="w-7 h-7 rounded-lg border border-red-100
                           bg-red-50 text-red-400 hover:bg-red-100
                           hover:text-red-600 flex items-center justify-center
                           transition-colors disabled:opacity-40 flex-shrink-0"
                title="Delete CV"
              >
                {isDeleting ? (
                  <SpinnerIcon/>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
// ── Main App ─────────────────────────────────────────────
export default function App() {
  const [step,        setStep]        = useState(0)
  const [cvData,      setCvData]      = useState(null)
  const [jobs,        setJobs]        = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [fetching,    setFetching]    = useState(false)
  const [showDB,      setShowDB]      = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const handleUploadSuccess = async (cv) => {
  setCvData(cv)
  setFetching(true)
  try {
    const { data } = await matchJobs(cv.id)
    console.log('CV data:', cv)          // ← thêm
    console.log('Jobs data:', data)      // ← thêm
    console.log('Jobs length:', data?.length)  // ← thêm
    setJobs(data)
    setStep(1)
  } catch(err) {
    console.error('matchJobs error:', err)  // ← thêm
  } finally {
    setFetching(false)
  }
}

  const handleSelectJob = (job) => {
    setSelectedJob(job)
    setStep(2)
  }

  const handleReset = () => {
    setStep(0)
    setCvData(null)
    setJobs([])
    setSelectedJob(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3
                         sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center
                            justify-center text-white font-medium text-xs">
              CV
            </div>
            <span className="font-medium text-gray-800 text-sm">
              CV Matching
            </span>
          </div>

          {/* Steps */}
          <Steps current={step}/>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDB(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                         text-gray-600 hover:bg-gray-50 transition-colors
                         flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
              Browse jobs
            </button>
            {cvData && (
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                 text-gray-600 hover:bg-gray-50 transition-colors
                 flex items-center gap-1.5"
            >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
            </svg>
              My applications
          </button>
                  )}
            {step > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-gray-600 px-2"
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
<main>
  {fetching && <LoadingScreen />}

  {!fetching && step === 0 && (
    <UploadScreen
      onSuccess={handleUploadSuccess}
      cvData={cvData}
      onSelectCV={async (cv) => {
        setCvData(cv)
        setFetching(true)
        try {
          const { data } = await matchJobs(cv.id)
          setJobs(data)
          setStep(1)
        } finally {
          setFetching(false)
        }
      }}
    />
  )}

  {!fetching && step === 1 && (
    <ResultsScreen
      cvData={cvData}
      jobs={jobs}
      onSelectJob={handleSelectJob}
      onReset={handleReset}
    />
  )}

  {!fetching && step === 2 && selectedJob && (
    <AnalysisScreen
      cvData={cvData}
      jobs={jobs}
      selectedJob={selectedJob}
      onSelectJob={handleSelectJob}
      onBack={() => setStep(1)}
    />
  )}
</main>

{showDB && (
  <JobsDatabase
    onClose={() => setShowDB(false)}
    cvData={cvData}
    onSelectJob={async (job) => {
      setShowDB(false)

      // Nếu chưa có CV → chuyển về upload trước
      if (!cvData) {
        alert('Please upload your CV first!')
        return
      }

      setFetching(true)
      try {
        // Fetch toàn bộ match để lấy score chính xác
        const { data: matchedJobs } = await matchJobs(cvData.id, 10)

        // Tìm job trong kết quả match
        const matched = matchedJobs.find(j => j.id === job.id)

        if (matched) {
          // Job có trong Top-10 → dùng score thật
          setJobs(matchedJobs)
          setSelectedJob(matched)
        } else {
          // Job không trong Top-10 → tính score riêng
          const { data: allMatched } = await matchJobs(cvData.id, 100)
          const foundInAll = allMatched.find(j => j.id === job.id)

          setJobs(matchedJobs)
          setSelectedJob(foundInAll || {
            ...job,
            score: 0,
            label: 'No Fit'
          })
        }
        setStep(2)
      } finally {
        setFetching(false)
      }
    }}
  />
)}

{showHistory && (
  <ApplicationHistory
    cvId={cvData?.id}
    onClose={() => setShowHistory(false)}
  />
)}

    </div>
  )
}