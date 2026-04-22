import { Briefcase, Star, TrendingUp, Minus } from 'lucide-react'

const LABEL_CONFIG = {
  'Good Fit'     : { color: 'bg-green-100 text-green-700',  icon: Star       },
  'Potential Fit': { color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  'No Fit'       : { color: 'bg-red-100 text-red-600',      icon: Minus      },
}

export default function JobCard({ job, rank, onSelect, isSelected }) {
  const config    = LABEL_CONFIG[job.label] || LABEL_CONFIG['No Fit']
  const LabelIcon = config.icon
  const scorePct  = Math.round(job.score * 100)

  return (
    <div
      onClick={() => onSelect(job)}
      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center
                          justify-center text-blue-600 font-bold text-sm flex-shrink-0">
            #{rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">
              {job.title}
            </h3>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5
                              rounded-full mt-1 font-medium ${config.color}`}>
              <LabelIcon size={11}/> {job.label}
            </span>
          </div>
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0 text-center">
          <div className={`text-2xl font-bold
            ${scorePct >= 70 ? 'text-green-600'
            : scorePct >= 40 ? 'text-yellow-600'
            : 'text-red-500'}`}>
            {scorePct}%
          </div>
          <div className="text-xs text-gray-400">match</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${scorePct >= 70 ? 'bg-green-500'
            : scorePct >= 40 ? 'bg-yellow-500'
            : 'bg-red-400'}`}
          style={{ width: `${scorePct}%` }}
        />
      </div>

      {/* Description preview */}
      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
        {job.description}
      </p>
    </div>
  )
}