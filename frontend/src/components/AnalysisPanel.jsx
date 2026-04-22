import { useState } from 'react'
import { analyzeJob, applyJob } from '../services/api'
import {
  CheckCircle, AlertCircle, Lightbulb,
  Send, Loader, ChevronDown, ChevronUp
} from 'lucide-react'

export default function AnalysisPanel({ job, cvId }) {
  const [analysis,  setAnalysis]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [applying,  setApplying]  = useState(false)
  const [applied,   setApplied]   = useState(false)
  const [showFull,  setShowFull]  = useState(false)
  const [error,     setError]     = useState('')

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await analyzeJob(job.id, cvId)
      setAnalysis(res.data)
    } catch {
      setError('Phân tích thất bại, thử lại nhé!')
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
      setError(err.response?.data?.detail || 'Ứng tuyển thất bại!')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">

      {/* Job header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Match score: {' '}
          <span className="font-semibold text-blue-600">
            {Math.round(job.score * 100)}%
          </span>
        </p>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">{job.description}</p>
        <div className="mt-2">
          <button
            onClick={() => setShowFull(!showFull)}
            className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
          >
            {showFull ? <><ChevronUp size={12}/> Ẩn bớt</>
                      : <><ChevronDown size={12}/> Xem requirements</>}
          </button>
          {showFull && (
            <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">
              {job.requirements}
            </p>
          )}
        </div>
      </div>

      {/* Analyze button */}
      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium
                     hover:bg-blue-700 disabled:opacity-50 transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader size={16} className="animate-spin"/> Đang phân tích...</>
            : '🔍 Phân tích CV vs JD'
          }
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="mt-4 space-y-4">

          {/* Overall */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">{analysis.overall_assessment}</p>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-500"/> Điểm mạnh
              </h4>
              <div className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="font-medium text-green-700 min-w-fit">
                      {s.skill}:
                    </span>
                    <span className="text-gray-600">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {analysis.missing_skills?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-yellow-500"/> Cần cải thiện
              </h4>
              <div className="space-y-2">
                {analysis.missing_skills.map((s, i) => (
                  <div key={i} className="p-2 bg-yellow-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-yellow-700">{s.skill}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full
                        ${s.importance === 'high'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {s.importance}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-blue-500"/> Gợi ý
              </h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-blue-400 mt-0.5">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply button */}
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`w-full py-3 rounded-xl font-medium transition-colors
                        flex items-center justify-center gap-2
              ${applied
                ? 'bg-green-100 text-green-700'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
              }`}
          >
            {applied   ? <><CheckCircle size={16}/> Đã ứng tuyển!</>
            : applying ? <><Loader size={16} className="animate-spin"/> Đang gửi...</>
            :             <><Send size={16}/> Ứng tuyển ngay</>
            }
          </button>
        </div>
      )}
    </div>
  )
}