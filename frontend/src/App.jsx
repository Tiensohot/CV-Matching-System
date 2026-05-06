import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  uploadCV, matchJobs, analyzeJob, applyJob,
  getCV, getAllJobs, getAllCVs, deleteCV,
  getApplicationHistory, updateApplicationStatus,
  matchRemoteJobs, getRemoteCountries, analyzeRemoteJob,
  applyWithEmail, registerUser, loginUser,
} from './services/api'


// ── Icons ────────────────────────────────────────────────
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
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
)
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)


// ── i18n ─────────────────────────────────────────────────
const I18N = {
  en: {
    // Nav
    nav_browse: 'Browse jobs', nav_history: 'My applications',
    nav_login: 'Login', nav_register: 'Register', nav_logout: 'Logout',
    nav_start_over: 'Start over', lang_toggle: 'Language',
    // Upload hero
    upload_badge: 'AI-Powered Career Matching',
    upload_hero_h1a: 'Find your', upload_hero_h1b: 'perfect job',
    upload_hero_h1c: 'with AI precision',
    upload_hero_desc: 'Upload your CV and our fine-tuned SBERT model instantly matches you with the most relevant opportunities — ranked by semantic similarity, not just keywords.',
    upload_stat_cat: 'Job categories', upload_stat_acc: 'Accuracy', upload_stat_spd: 'Matching speed',
    upload_panel_title: 'Upload your CV', upload_panel_sub: 'PDF or DOCX · Max 10MB',
    upload_drop: 'Drag & drop your CV', upload_drop_active: 'Drop it here...', upload_click: 'or click to browse',
    upload_proc: 'Extracting text & generating embeddings...',
    upload_ok: 'Upload successful!', upload_finding: 'Finding matching jobs...',
    upload_fail: 'Upload failed!', upload_retry: 'Click to try again',
    upload_f1: 'Extracts text from scanned PDFs via OCR',
    upload_f2: 'Fine-tuned SBERT for semantic matching',
    upload_f3: 'GPT-powered CV analysis & recommendations',
    upload_how: 'How it works',
    s1t: 'Upload your CV',    s1d: 'Drop your PDF or DOCX. OCR engine extracts every detail — even from scanned documents.',
    s2t: 'AI matching',       s2d: 'Fine-tuned SBERT encodes your CV into a 768-dim vector and compares against every job.',
    s3t: 'Get insights',      s3d: 'Ranked Top-10 with match scores, strengths, skill gaps and AI-powered recommendations.',
    saved_cvs: 'Saved CVs', saved_cvs_sub: 'Reuse previous uploads',
    // CV Preview
    cv_processed: '✓ Processed', cv_loading: 'Loading CV content...',
    cv_collapse: '▲ Collapse', cv_expand: '▼ View full content',
    cv_no_content: 'Could not read CV content', cv_chars: 'characters',
    // Results
    results_top: 'Top', results_jobs: 'matching jobs',
    results_ai: 'Based on AI analysis of your CV',
    results_remote_sub: 'Real-time from RemoteOK.com',
    results_another: 'Upload another CV',
    tab_db: 'Database', tab_remote: 'Remote Jobs',
    // Remote tab
    remote_all: 'All countries', remote_searching: 'Searching...',
    remote_btn: 'Find Remote Jobs', remote_lang_lbl: 'Analysis language:',
    remote_empty_t: 'Find remote jobs worldwide',
    remote_empty_s: 'Results from RemoteOK.com — apply directly on their site',
    remote_loading: 'Loading jobs from RemoteOK and encoding embeddings...',
    remote_found: 'Found', remote_found2: 'matching jobs', remote_from: 'from',
    remote_rj: 'remote jobs', remote_in: 'in', remote_no: 'No matching results found',
    remote_analyze: '🔍 Analyze CV', remote_apply_ok: 'Apply on RemoteOK',
    // Analysis panel
    match_score: 'Match score', hide_req: '▲ Hide requirements', show_req: '▼ View requirements',
    analyze_btn: '🔍 Analyze CV vs JD', analyzing: 'Analyzing...', analyze_fail: 'Analysis failed, please try again!',
    strengths: 'Strengths', skills_improve: 'Skills to improve',
    recommendations: '💡 Recommendations', apply_now: 'Apply Now',
    // Analysis screen
    back_results: '← Back to results', in_matches: 'in your matches',
    match_score_lbl: 'match score', pro_tip: 'Pro tip',
    boost_t: 'Boost your match score',
    boost_d: 'Tailor your CV keywords to match the job requirements. Candidates who do this see up to 40% higher match scores.',
    atips: ['Use exact keywords from the JD', 'Quantify your achievements', 'Add missing skills to projects'],
    why_t: 'Why CV Matching?',
    stat_lbls: ['CVs analyzed', 'Model accuracy', 'Embedding dimensions', 'Average match time'],
    ready_t: 'Ready to apply?',
    ready_d: "Don't wait — top candidates apply within 24 hours of finding a match.",
    ready_s: 'AI analysis completed · Ready to submit',
    // Loading
    loading: 'Finding matching jobs...',
    // App history
    hist_t: 'Application history', hist_app_s: 'application', hist_app_p: 'applications',
    hist_loading: 'Loading...', hist_err: 'Failed to load applications',
    hist_empty_t: 'No applications yet', hist_empty_s: 'Upload your CV and start applying to jobs',
    hist_applied: 'Applied', hist_match: 'match',
    // Jobs DB
    db_t: 'Job Database', db_avail: 'jobs available',
    db_search: 'Search jobs by title or description...',
    db_loading: 'Loading jobs...', db_no: 'No jobs found', db_analyze: 'Analyze with CV',
    db_page: 'Page', db_of: 'of', db_prev: '← Previous', db_next: 'Next →',
    // CV Library
    cv_extracted: '✓ Extracted', cv_no_text: '✗ No text',
    cv_active: 'Currently active', cv_use: 'Use this CV', cv_no_cvs: 'No CVs uploaded yet',
    // Auth
    auth_login: 'Login', auth_register: 'Register', auth_name: 'Full name',
    auth_email: 'Email', auth_pass: 'Password', auth_proc: 'Processing...',
    auth_no_acc: "Don't have an account?", auth_has_acc: 'Already have an account?',
    auth_reg_now: 'Register now', auth_login_lnk: 'Login',
    // Apply modal
    apl_t: 'Submit Application', apl_sub: 'Email with your CV will be sent automatically',
    apl_name: 'Full name', apl_email: 'Your email', apl_emp_email: 'Employer email',
    apl_auto: '✓ auto-detected', apl_msg: 'Cover message', apl_msg_opt: '(optional)',
    apl_msg_ph: 'Brief introduction...', apl_cancel: 'Cancel',
    apl_sending: 'Sending...', apl_submit: 'Submit',
    // Remote Analysis Modal
    ra_back: '← Back to results', ra_lang: 'Analysis language',
    ra_btn: '🔍 Analyze CV vs Job', ra_analyzing: 'Analyzing with AI...',
    ra_overall: 'Overall Assessment', ra_strengths: 'Strengths',
    ra_improve: 'Skills to Improve', ra_recommend: '💡 Recommendations',
    ra_apply: 'Apply on RemoteOK', ra_match: 'Match Details', ra_verdict: 'Verdict',
    ra_dirty: 'Language changed — click Analyze again',
    ra_ready_t: 'Ready to apply?',
    ra_ready_d: "Don't wait — top candidates apply within 24 hours of finding a match.",
    ra_tip_l: 'Pro tip', ra_tip_t: 'Boost your match score',
    ra_tip_d: 'Tailor your CV keywords to the job. Candidates who do this see up to 40% higher match scores.',
    ra_tips: ['Use exact keywords from the JD', 'Quantify your achievements', 'Add missing skills to projects'],
    ra_source: 'From RemoteOK.com · Real-time listing',
  },
  vi: {
    // Nav
    nav_browse: 'Xem việc làm', nav_history: 'Lịch sử ứng tuyển',
    nav_login: 'Đăng nhập', nav_register: 'Đăng ký', nav_logout: 'Đăng xuất',
    nav_start_over: 'Bắt đầu lại', lang_toggle: 'Ngôn ngữ',
    // Upload hero
    upload_badge: 'AI-Powered Career Matching',
    upload_hero_h1a: 'Tìm', upload_hero_h1b: 'việc làm phù hợp',
    upload_hero_h1c: 'với độ chính xác AI',
    upload_hero_desc: 'Tải lên CV và mô hình SBERT tinh chỉnh của chúng tôi ngay lập tức ghép bạn với những cơ hội phù hợp nhất — xếp hạng theo độ tương đồng ngữ nghĩa, không chỉ từ khóa.',
    upload_stat_cat: 'Danh mục việc làm', upload_stat_acc: 'Độ chính xác', upload_stat_spd: 'Tốc độ matching',
    upload_panel_title: 'Tải lên CV của bạn', upload_panel_sub: 'PDF hoặc DOCX · Tối đa 10MB',
    upload_drop: 'Kéo & thả CV vào đây', upload_drop_active: 'Thả vào đây...', upload_click: 'hoặc nhấn để chọn file',
    upload_proc: 'Đang trích xuất văn bản & tạo embeddings...',
    upload_ok: 'Tải lên thành công!', upload_finding: 'Đang tìm việc phù hợp...',
    upload_fail: 'Tải lên thất bại!', upload_retry: 'Nhấn để thử lại',
    upload_f1: 'Trích xuất văn bản từ PDF scan bằng OCR',
    upload_f2: 'SBERT tinh chỉnh cho semantic matching',
    upload_f3: 'Phân tích CV & gợi ý bằng GPT',
    upload_how: 'Cách hoạt động',
    s1t: 'Tải lên CV',       s1d: 'Upload PDF hoặc DOCX. OCR engine trích xuất mọi thông tin — kể cả từ tài liệu scan.',
    s2t: 'AI matching',      s2d: 'SBERT tinh chỉnh mã hóa CV thành vector 768 chiều và so sánh với từng việc làm.',
    s3t: 'Nhận kết quả',     s3d: 'Top-10 xếp hạng với điểm tương đồng, điểm mạnh, kỹ năng thiếu và gợi ý AI.',
    saved_cvs: 'CV đã lưu', saved_cvs_sub: 'Sử dụng lại các lần upload trước',
    // CV Preview
    cv_processed: '✓ Đã xử lý', cv_loading: 'Đang tải nội dung CV...',
    cv_collapse: '▲ Thu gọn', cv_expand: '▼ Xem toàn bộ nội dung',
    cv_no_content: 'Không thể đọc nội dung CV', cv_chars: 'ký tự',
    // Results
    results_top: 'Top', results_jobs: 'việc làm phù hợp',
    results_ai: 'Dựa trên phân tích AI của CV bạn',
    results_remote_sub: 'Thời gian thực từ RemoteOK.com',
    results_another: 'Tải lên CV khác',
    tab_db: 'Cơ sở dữ liệu', tab_remote: 'Remote Jobs',
    // Remote tab
    remote_all: 'Tất cả quốc gia', remote_searching: 'Đang tìm...',
    remote_btn: 'Tìm việc Remote', remote_lang_lbl: 'Ngôn ngữ phân tích:',
    remote_empty_t: 'Tìm việc làm remote toàn cầu',
    remote_empty_s: 'Kết quả từ RemoteOK.com — ứng tuyển trực tiếp trên trang chủ',
    remote_loading: 'Đang tải job từ RemoteOK và encode embeddings...',
    remote_found: 'Đã tìm thấy', remote_found2: 'việc phù hợp', remote_from: 'từ',
    remote_rj: 'job remote', remote_in: 'tại', remote_no: 'Không tìm thấy kết quả phù hợp',
    remote_analyze: '🔍 Phân tích CV', remote_apply_ok: 'Ứng tuyển trên RemoteOK',
    // Analysis panel
    match_score: 'Điểm tương đồng', hide_req: '▲ Ẩn yêu cầu', show_req: '▼ Xem yêu cầu',
    analyze_btn: '🔍 Phân tích CV vs JD', analyzing: 'Đang phân tích...', analyze_fail: 'Phân tích thất bại, vui lòng thử lại!',
    strengths: 'Điểm mạnh', skills_improve: 'Kỹ năng cần cải thiện',
    recommendations: '💡 Gợi ý cải thiện', apply_now: 'Ứng tuyển ngay',
    // Analysis screen
    back_results: '← Quay lại kết quả', in_matches: 'trong danh sách của bạn',
    match_score_lbl: 'điểm tương đồng', pro_tip: 'Mẹo hay',
    boost_t: 'Tăng điểm tương đồng',
    boost_d: 'Điều chỉnh từ khóa CV theo yêu cầu công việc. Ứng viên làm điều này đạt điểm matching cao hơn tới 40%.',
    atips: ['Dùng đúng từ khóa trong JD', 'Định lượng thành tích bằng con số', 'Bổ sung kỹ năng còn thiếu vào dự án'],
    why_t: 'Tại sao chọn CV Matching?',
    stat_lbls: ['CV đã phân tích', 'Độ chính xác mô hình', 'Số chiều embedding', 'Thời gian matching TB'],
    ready_t: 'Sẵn sàng ứng tuyển?',
    ready_d: 'Đừng chần chừ — ứng viên hàng đầu nộp đơn trong vòng 24 giờ sau khi tìm được việc phù hợp.',
    ready_s: 'Phân tích AI hoàn tất · Sẵn sàng nộp đơn',
    // Loading
    loading: 'Đang tìm việc làm phù hợp...',
    // App history
    hist_t: 'Lịch sử ứng tuyển', hist_app_s: 'đơn ứng tuyển', hist_app_p: 'đơn ứng tuyển',
    hist_loading: 'Đang tải...', hist_err: 'Không thể tải lịch sử ứng tuyển',
    hist_empty_t: 'Chưa có đơn ứng tuyển nào', hist_empty_s: 'Tải lên CV và bắt đầu ứng tuyển',
    hist_applied: 'Đã nộp', hist_match: 'phù hợp',
    // Jobs DB
    db_t: 'Cơ sở dữ liệu việc làm', db_avail: 'việc làm',
    db_search: 'Tìm kiếm theo tiêu đề hoặc mô tả...',
    db_loading: 'Đang tải...', db_no: 'Không tìm thấy việc làm', db_analyze: 'Phân tích với CV',
    db_page: 'Trang', db_of: 'trong', db_prev: '← Trước', db_next: 'Tiếp →',
    // CV Library
    cv_extracted: '✓ Đã trích xuất', cv_no_text: '✗ Không có text',
    cv_active: 'Đang sử dụng', cv_use: 'Dùng CV này', cv_no_cvs: 'Chưa có CV nào được tải lên',
    // Auth
    auth_login: 'Đăng nhập', auth_register: 'Đăng ký', auth_name: 'Họ tên',
    auth_email: 'Email', auth_pass: 'Mật khẩu', auth_proc: 'Đang xử lý...',
    auth_no_acc: 'Chưa có tài khoản?', auth_has_acc: 'Đã có tài khoản?',
    auth_reg_now: 'Đăng ký ngay', auth_login_lnk: 'Đăng nhập',
    // Apply modal
    apl_t: 'Nộp hồ sơ ứng tuyển', apl_sub: 'Email kèm CV sẽ được gửi tự động',
    apl_name: 'Họ tên', apl_email: 'Email ứng viên', apl_emp_email: 'Email nhà tuyển dụng',
    apl_auto: '✓ tự động tìm thấy', apl_msg: 'Tin nhắn kèm theo', apl_msg_opt: '(tùy chọn)',
    apl_msg_ph: 'Giới thiệu ngắn về bản thân...', apl_cancel: 'Hủy',
    apl_sending: 'Đang gửi...', apl_submit: 'Gửi hồ sơ',
    // Remote Analysis Modal
    ra_back: '← Quay lại kết quả', ra_lang: 'Ngôn ngữ phân tích',
    ra_btn: '🔍 Phân tích CV vs Công việc', ra_analyzing: 'Đang phân tích bằng AI...',
    ra_overall: 'Đánh giá tổng quan', ra_strengths: 'Điểm mạnh',
    ra_improve: 'Kỹ năng cần cải thiện', ra_recommend: '💡 Gợi ý cải thiện',
    ra_apply: 'Ứng tuyển trên RemoteOK', ra_match: 'Chi tiết điểm số', ra_verdict: 'Đánh giá',
    ra_dirty: 'Đã đổi ngôn ngữ — nhấn Phân tích để cập nhật',
    ra_ready_t: 'Sẵn sàng ứng tuyển?',
    ra_ready_d: 'Đừng chần chừ — ứng viên hàng đầu nộp đơn trong vòng 24 giờ sau khi tìm được việc phù hợp.',
    ra_tip_l: 'Mẹo hay', ra_tip_t: 'Tăng điểm tương đồng',
    ra_tip_d: 'Điều chỉnh từ khóa CV theo JD. Ứng viên làm điều này đạt điểm matching cao hơn tới 40%.',
    ra_tips: ['Dùng đúng từ khóa trong JD', 'Định lượng thành tích bằng con số', 'Bổ sung kỹ năng còn thiếu vào dự án'],
    ra_source: 'Từ RemoteOK.com · Cập nhật thực time',
  },
}

const LangContext = createContext({ lang: 'vi', setLang: () => {}, L: I18N.vi })
const useLang = () => useContext(LangContext)


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
const UploadScreen = ({ onSuccess, cvData, onSelectCV }) => {
  const { L } = useLang()
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

        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize : '40px 40px'
          }}/>
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#3b82f6', filter: 'blur(60px)' }}/>
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: '#6366f1', filter: 'blur(50px)' }}/>

        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5
                              rounded-full border border-blue-400
                              border-opacity-40 bg-blue-500 bg-opacity-10 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                <span className="text-xs text-blue-300 font-medium">
                  {L.upload_badge}
                </span>
              </div>
              <h1 className="text-4xl font-medium text-white leading-tight mb-4">
                {L.upload_hero_h1a}{' '}
                <span style={{ color: '#60a5fa' }}>{L.upload_hero_h1b}</span>
                <br/>{L.upload_hero_h1c}
              </h1>
              <p className="text-base text-gray-300 leading-relaxed mb-8">
                {L.upload_hero_desc}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '10+', label: L.upload_stat_cat },
                  { value: '99%', label: L.upload_stat_acc },
                  { value: '<3s', label: L.upload_stat_spd },
                ].map((s, i) => (
                  <div key={i}
                    className="rounded-xl p-4 border border-white border-opacity-10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-2xl font-medium text-white mb-0.5">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-medium text-sm">CV</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{L.upload_panel_title}</p>
                    <p className="text-xs text-gray-400">{L.upload_panel_sub}</p>
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150
                    ${isDragActive       ? 'border-blue-500 bg-blue-50'
                    : status==='uploading'? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                    : status==='success'  ? 'border-green-400 bg-green-50'
                    : status==='error'    ? 'border-red-300 bg-red-50'
                    :                       'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
                >
                  <input {...getInputProps()}/>
                  {status === 'idle' && (
                    <>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600"><UploadIcon/></div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{isDragActive ? L.upload_drop_active : L.upload_drop}</p>
                      <p className="text-xs text-gray-400">{L.upload_click}</p>
                    </>
                  )}
                  {status === 'uploading' && (
                    <>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600"><SpinnerIcon/></div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Processing <span className="text-blue-600">{filename}</span></p>
                      <p className="text-xs text-gray-400">{L.upload_proc}</p>
                      <div className="mt-4 h-1 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3"/>
                      </div>
                    </>
                  )}
                  {status === 'success' && (
                    <>
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-green-600"><CheckIcon size={20}/></div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{L.upload_ok}</p>
                      <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><FileIcon/> {filename}</p>
                      <p className="text-xs text-blue-600 mt-1">{L.upload_finding}</p>
                    </>
                  )}
                  {status === 'error' && (
                    <>
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-red-500"><AlertIcon/></div>
                      <p className="text-sm font-medium text-red-600 mb-1">{L.upload_fail}</p>
                      <p className="text-xs text-red-400 mb-2">{error}</p>
                      <p className="text-xs text-gray-400">{L.upload_retry}</p>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {[L.upload_f1, L.upload_f2, L.upload_f3].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
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

      {/* How it works + CV Library */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">{L.upload_how}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step:'01', color:'bg-blue-50 text-blue-700',    title: L.s1t, desc: L.s1d },
                { step:'02', color:'bg-purple-50 text-purple-700', title: L.s2t, desc: L.s2d },
                { step:'03', color:'bg-green-50 text-green-700',   title: L.s3t, desc: L.s3d },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-xs font-medium mb-3`}>{item.step}</div>
                  <p className="text-sm font-medium text-gray-800 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">{L.saved_cvs}</p>
                <span className="text-xs text-gray-400">{L.saved_cvs_sub}</span>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                <CVLibrary onSelectCV={onSelectCV} currentCvId={cvData?.id}/>
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
  const { L } = useLang()
  const [expanded, setExpanded] = useState(false)
  const [cvText,   setCvText]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!cvData?.id) return
    getCV(cvData.id)
      .then(res => setCvText(res.data?.raw_text || ''))
      .catch(() => setCvText(''))
      .finally(() => setLoading(false))
  }, [cvData?.id])

  const preview = cvText.slice(0, 300)
  const hasMore = cvText.length > 300

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><FileIcon/></div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-none">{cvData?.filename}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cvText.length > 0 ? `${cvText.length.toLocaleString()} ${L.cv_chars}` : L.cv_loading}</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">{L.cv_processed}</span>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><SpinnerIcon/> {L.cv_loading}</div>
        ) : cvText ? (
          <>
            <pre className={`text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed ${!expanded ? 'line-clamp-6' : ''}`}>
              {expanded ? cvText : preview}{!expanded && hasMore && '...'}
            </pre>
            {hasMore && (
              <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1">
                {expanded ? L.cv_collapse : `${L.cv_expand} (${cvText.length.toLocaleString()} ${L.cv_chars})`}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 py-2">{L.cv_no_content}</p>
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
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 hover:shadow-sm hover:-translate-y-px
        ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-sm flex-shrink-0">#{rank}</div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-snug">{job.title}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${cfg.cls}`}>
              {Icon && <Icon/>} {job.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-medium ${pct>=70?'text-green-600':pct>=40?'text-yellow-600':'text-red-400'}`}>{pct}%</div>
          <div className="text-xs text-gray-400">match</div>
        </div>
      </div>
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${pct>=70?'bg-green-500':pct>=40?'bg-yellow-400':'bg-red-400'}`} style={{ width:`${pct}%` }}/>
      </div>
      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{job.description}</p>
    </div>
  )
}


// ── Remote Job Card ──────────────────────────────────────
const RemoteJobCard = ({ job, rank, cvId, onAnalyze }) => {
  const { L } = useLang()
  const pct = Math.round((job.score || 0) * 100)
  const labelCfg = {
    'Good Fit'     : { cls: 'bg-green-50 text-green-700',   Icon: StarIcon  },
    'Potential Fit': { cls: 'bg-yellow-50 text-yellow-700', Icon: TrendIcon },
    'No Fit'       : { cls: 'bg-red-50 text-red-500',       Icon: null      },
  }
  const cfg  = labelCfg[job.label] || labelCfg['No Fit']
  const Icon = cfg.Icon

  return (
    <div className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 transition-all duration-150 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {job.logo ? (
            <img src={job.logo} alt={job.company} className="w-9 h-9 rounded-lg object-contain border border-gray-100 flex-shrink-0 bg-white"/>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-sm flex-shrink-0">#{rank}</div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 leading-snug">{job.position}</p>
            <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                {Icon && <Icon/>} {job.label}
              </span>
              {job.location && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <GlobeIcon/> {job.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-medium ${pct>=70?'text-green-600':pct>=40?'text-yellow-600':'text-red-400'}`}>{pct}%</div>
          <div className="text-xs text-gray-400">match</div>
        </div>
      </div>

      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${pct>=70?'bg-green-500':pct>=40?'bg-yellow-400':'bg-red-400'}`} style={{ width:`${pct}%` }}/>
      </div>

      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {job.tags.slice(0, 5).map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{job.description_clean}</p>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAnalyze(job)}
          disabled={!cvId}
          className="flex-1 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
        >
          {L.remote_analyze}
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 rounded-lg border border-green-600 text-green-700 text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <ExternalLinkIcon/> {L.remote_apply_ok}
        </a>
      </div>
    </div>
  )
}


// ── Remote Analysis Modal ────────────────────────────────
const RemoteAnalysisModal = ({ job, cvId, onClose }) => {
  const { lang, L } = useLang()
  const [analysis,     setAnalysis]     = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [analysisLang, setAnalysisLang] = useState(lang)

  const langDirty = analysis !== null && lang !== analysisLang
  const pct = Math.round((job.score || 0) * 100)

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setAnalysisLang(lang)
    try {
      const res = await analyzeRemoteJob(cvId, job, lang)
      setAnalysis(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || L.analyze_fail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#f8fafc' }}>
      <div className="min-h-screen">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between">
          <button onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors">
            <BackIcon/> {L.ra_back}
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Job header card (dark gradient) */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 mb-6"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="relative px-8 py-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {job.logo ? (
                    <img src={job.logo} alt={job.company}
                      className="w-12 h-12 rounded-xl object-contain bg-white p-1 flex-shrink-0 border border-white border-opacity-20"/>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-300"
                      style={{ background: 'rgba(96,165,250,0.2)' }}>
                      <GlobeIcon/>
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#93c5fd' }}>
                        Remote · {job.location}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${job.label==='Good Fit'?'bg-green-500 bg-opacity-20 text-green-300'
                        :job.label==='Potential Fit'?'bg-yellow-500 bg-opacity-20 text-yellow-300'
                        :'bg-red-500 bg-opacity-20 text-red-300'}`}>
                        {job.label}
                      </span>
                    </div>
                    <h1 className="text-2xl font-medium text-white mb-1 leading-snug">{job.position}</h1>
                    <p className="text-gray-400 text-sm">{job.company}</p>
                  </div>
                </div>
                {/* Score pill */}
                <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className={`text-4xl font-medium mb-1
                    ${pct>=70?'text-green-400':pct>=40?'text-yellow-400':'text-red-400'}`}>{pct}%</div>
                  <div className="text-xs text-gray-400">{L.match_score_lbl}</div>
                  <div className="mt-2 w-16 h-1 bg-white bg-opacity-10 rounded-full overflow-hidden mx-auto">
                    <div className={`h-full rounded-full ${pct>=70?'bg-green-400':pct>=40?'bg-yellow-400':'bg-red-400'}`}
                      style={{ width:`${pct}%` }}/>
                  </div>
                </div>
              </div>
              {job.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {job.tags.slice(0, 10).map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-5">
            {/* Left 3/5 */}
            <div className="lg:col-span-3 xl:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-4">{job.description_clean}</p>

                {langDirty && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                    <AlertIcon/> {L.ra_dirty}
                  </div>
                )}

                {(!analysis || langDirty) && !loading && (
                  <button onClick={handleAnalyze}
                    className="w-full py-2.5 rounded-full bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                    {L.ra_btn}
                  </button>
                )}

                {loading && (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <SpinnerIcon/>
                    <p className="text-sm text-gray-500">{L.ra_analyzing}</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                    <AlertIcon/> {error}
                  </div>
                )}

                {analysis && !langDirty && (
                  <div className="mt-4 space-y-4">
                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1.5">{L.ra_overall}</p>
                      <p className="text-sm text-blue-800 leading-relaxed">{analysis.overall_assessment}</p>
                    </div>

                    {analysis.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                          <span className="text-green-600"><CheckIcon size={14}/></span> {L.ra_strengths}
                        </p>
                        <div className="space-y-1.5">
                          {analysis.strengths.map((s, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="font-medium text-green-700 min-w-fit">{s.skill}:</span>
                              <span className="text-gray-500">{s.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.missing_skills?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                          <span className="text-yellow-500"><AlertIcon/></span> {L.ra_improve}
                        </p>
                        <div className="space-y-2">
                          {analysis.missing_skills.map((s, i) => (
                            <div key={i} className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-100 text-sm">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-yellow-800">{s.skill}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.importance==='high'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>{s.importance}</span>
                              </div>
                              <p className="text-gray-500 text-xs">{s.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.recommendations?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">{L.ra_recommend}</p>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-gray-500 flex gap-2 leading-relaxed">
                              <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors">
                      <ExternalLinkIcon/> {L.ra_apply}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right 2/5 */}
            <div className="lg:col-span-2 xl:col-span-1 space-y-4">
              {/* Match details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">{L.ra_match}</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Score</span>
                    <span className={`text-sm font-medium ${pct>=70?'text-green-600':pct>=40?'text-yellow-600':'text-red-500'}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct>=70?'bg-green-500':pct>=40?'bg-yellow-400':'bg-red-400'}`} style={{ width:`${pct}%` }}/>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{L.ra_verdict}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.label==='Good Fit'?'bg-green-50 text-green-700':job.label==='Potential Fit'?'bg-yellow-50 text-yellow-700':'bg-red-50 text-red-500'}`}>{job.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Source</span>
                    <span className="text-xs text-gray-400">RemoteOK.com</span>
                  </div>
                </div>
              </div>

              {/* Pro tip card */}
              <div className="rounded-2xl overflow-hidden border border-gray-200"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                <div className="p-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-3"
                    style={{ background: 'rgba(96,165,250,0.15)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                    <span className="text-xs text-blue-300 font-medium">{L.ra_tip_l}</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-2">{L.ra_tip_t}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">{L.ra_tip_d}</p>
                  <div className="space-y-1.5">
                    {L.ra_tips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(96,165,250,0.2)' }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply CTA */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-5" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                  <h3 className="text-sm font-medium text-white mb-1.5">{L.ra_ready_t}</h3>
                  <p className="text-xs text-green-200 leading-relaxed mb-4">{L.ra_ready_d}</p>
                  <div className="flex items-center gap-2 text-xs text-green-300 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                    {L.ra_source}
                  </div>
                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-green-400 text-green-900 text-xs font-medium hover:bg-green-300 transition-colors">
                    <ExternalLinkIcon/> {L.ra_apply}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ── Remote Jobs Tab ──────────────────────────────────────
const RemoteJobsTab = ({ cvData }) => {
  const { lang, L } = useLang()
  const [countries,       setCountries]       = useState([])
  const [selectedCountry, setSelectedCountry] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [results,         setResults]         = useState(null)
  const [totalFetched,    setTotalFetched]    = useState(0)
  const [error,           setError]           = useState('')
  const [analyzeTarget,   setAnalyzeTarget]   = useState(null)

  useEffect(() => {
    getRemoteCountries()
      .then(res => setCountries(res.data))
      .catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!cvData?.id) return
    setLoading(true)
    setError('')
    try {
      const res = await matchRemoteJobs(cvData.id, selectedCountry || null)
      setResults(res.data.results)
      setTotalFetched(res.data.total_fetched)
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể kết nối RemoteOK API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-400 text-gray-600"
        >
          <option value="">{L.remote_all}</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          disabled={loading || !cvData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? <><SpinnerIcon/> {L.remote_searching}</> : <><GlobeIcon/> {L.remote_btn}</>}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
          <AlertIcon/> {error}
        </div>
      )}

      {results === null && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
            <GlobeIcon/>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">{L.remote_empty_t}</p>
          <p className="text-xs text-gray-400">{L.remote_empty_s}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <SpinnerIcon/>
          <p className="text-sm text-gray-500 mt-3">{L.remote_loading}</p>
        </div>
      )}

      {results !== null && !loading && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {L.remote_found} <strong className="text-gray-600">{results.length} {L.remote_found2}</strong> {L.remote_from} {totalFetched} {L.remote_rj}{selectedCountry ? ` ${L.remote_in} ${selectedCountry}` : ''}
          </p>
          {results.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">{L.remote_no}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map((job, i) => (
                <RemoteJobCard
                  key={i}
                  job={job}
                  rank={i + 1}
                  cvId={cvData?.id}
                  onAnalyze={setAnalyzeTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Analysis modal */}
      {analyzeTarget && (
        <RemoteAnalysisModal
          job={analyzeTarget}
          cvId={cvData?.id}
          onClose={() => setAnalyzeTarget(null)}
        />
      )}
    </div>
  )
}


// ── Results Screen ───────────────────────────────────────
const ResultsScreen = ({ cvData, jobs, onSelectJob, onReset, onApply }) => {
  const { L } = useLang()
  const [activeTab, setActiveTab] = useState('database')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-medium text-gray-800">
            {activeTab === 'database' ? `${L.results_top} ${jobs.length} ${L.results_jobs}` : L.tab_remote}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeTab === 'database' ? L.results_ai : L.results_remote_sub}
          </p>
        </div>
        <button onClick={onReset} className="text-sm text-blue-600 hover:underline">{L.results_another}</button>
      </div>

      <CVPreview cvData={cvData}/>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'database' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileIcon/> {L.tab_db}
        </button>
        <button
          onClick={() => setActiveTab('remote')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'remote' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <GlobeIcon/> {L.tab_remote}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'database' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} rank={i + 1} onClick={() => onSelectJob(job)}/>
          ))}
        </div>
      ) : (
        <RemoteJobsTab cvData={cvData}/>
      )}
    </div>
  )
}


// ── Analysis Panel ───────────────────────────────────────
const AnalysisPanel = ({ job, cvId, onApply }) => {
  const { lang, L } = useLang()
  const [analysis, setAnalysis] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [showReq,  setShowReq]  = useState(false)
  const [error,    setError]    = useState('')

  const handleAnalyze = async () => {
    setLoading(true); setError('')
    try {
      const res = await analyzeJob(job.id, cvId, lang)
      setAnalysis(res.data)
    } catch (err) {
      console.error(err)
      setError(L.analyze_fail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-medium text-gray-800">{job.title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {L.match_score}:{' '}
          <span className="font-medium text-blue-600">{Math.round(job.score * 100)}%</span>
          {' · '}
          <span className={`font-medium ${job.label==='Good Fit'?'text-green-600':job.label==='Potential Fit'?'text-yellow-600':'text-red-500'}`}>
            {job.label}
          </span>
        </p>
      </div>

      <p className="text-sm text-gray-500 mb-3">{job.description}</p>

      <button onClick={() => setShowReq(!showReq)} className="text-xs text-blue-500 hover:underline mb-4 block">
        {showReq ? L.hide_req : L.show_req}
      </button>
      {showReq && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">{job.requirements}</div>
      )}

      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><SpinnerIcon/> {L.analyzing}</> : L.analyze_btn}
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}

      {analysis && (
        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">{analysis.overall_assessment}</p>
          </div>

          {analysis.strengths?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <span className="text-green-600"><CheckIcon size={14}/></span> {L.strengths}
              </p>
              <div className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="font-medium text-green-700 min-w-fit">{s.skill}:</span>
                    <span className="text-gray-500">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.missing_skills?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <span className="text-yellow-500"><AlertIcon/></span> {L.skills_improve}
              </p>
              <div className="space-y-2">
                {analysis.missing_skills.map((s, i) => (
                  <div key={i} className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-100 text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-yellow-800">{s.skill}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.importance==='high'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>{s.importance}</span>
                    </div>
                    <p className="text-gray-500 text-xs">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{L.recommendations}</p>
              <ul className="space-y-1">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-500 flex gap-2 leading-relaxed">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => onApply(job, 'database')}
            className="w-full py-2.5 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
          >
            <SendIcon/> {L.apply_now}
          </button>
        </div>
      )}
    </div>
  )
}


// ── Analysis Screen ──────────────────────────────────────
const AnalysisScreen = ({ cvData, jobs, selectedJob, onSelectJob, onBack, onApply }) => {
  const { L } = useLang()
  return (
  <div className="min-h-screen" style={{ background: '#f8fafc' }}>

    <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors">
        <BackIcon/> {L.back_results}
      </button>
    </div>

    <div className="max-w-7xl mx-auto px-6 pb-12">

      {/* Job header card */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>

        <div className="absolute opacity-5 inset-0 pointer-events-none"
          style={{ backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>

        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background:'rgba(255,255,255,0.1)', color:'#93c5fd' }}>
                  #{jobs.findIndex(j => j.id === selectedJob.id) + 1} {L.in_matches}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium
                  ${selectedJob.label==='Good Fit'?'bg-green-500 bg-opacity-20 text-green-300'
                  :selectedJob.label==='Potential Fit'?'bg-yellow-500 bg-opacity-20 text-yellow-300'
                  :'bg-red-500 bg-opacity-20 text-red-300'}`}>
                  {selectedJob.label}
                </span>
              </div>
              <h1 className="text-3xl font-medium text-white mb-3">{selectedJob.title}</h1>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xl">{selectedJob.description}</p>
            </div>

            <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl" style={{ background:'rgba(255,255,255,0.07)' }}>
              <div className={`text-5xl font-medium mb-1 ${Math.round(selectedJob.score*100)>=70?'text-green-400':Math.round(selectedJob.score*100)>=40?'text-yellow-400':'text-red-400'}`}>
                {Math.round(selectedJob.score * 100)}%
              </div>
              <div className="text-xs text-gray-400">{L.match_score_lbl}</div>
              <div className="mt-3 w-20 h-1 bg-white bg-opacity-10 rounded-full overflow-hidden mx-auto">
                <div className={`h-full rounded-full ${Math.round(selectedJob.score*100)>=70?'bg-green-400':Math.round(selectedJob.score*100)>=40?'bg-yellow-400':'bg-red-400'}`}
                  style={{ width:`${Math.round(selectedJob.score*100)}%` }}/>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {selectedJob.requirements.split(',').slice(0, 8).map((req, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background:'rgba(255,255,255,0.08)', color:'#cbd5e1' }}>
                {req.trim().split('.')[0].trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2 col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-5">
        <div className="lg:col-span-3 xl:col-span-2">
          <AnalysisPanel job={selectedJob} cvId={cvData?.id} onApply={onApply}/>
        </div>
        <div className="lg:col-span-2 xl:col-span-1 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-gray-200"
            style={{ background:'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="p-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full mb-4" style={{ background:'rgba(96,165,250,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                <span className="text-xs text-blue-300 font-medium">{L.pro_tip}</span>
              </div>
              <h3 className="text-base font-medium text-white mb-2">{L.boost_t}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {L.boost_d}
              </p>
              <div className="space-y-2">
                {L.atips.map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'rgba(96,165,250,0.2)' }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">{L.why_t}</p>
            <div className="space-y-4">
              {[
                { value:'6,241', label: L.stat_lbls[0], color:'text-blue-600'   },
                { value:'99.6%', label: L.stat_lbls[1], color:'text-green-600'  },
                { value:'768',   label: L.stat_lbls[2], color:'text-purple-600' },
                { value:'<3s',   label: L.stat_lbls[3], color:'text-yellow-600' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className={`text-sm font-medium ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5" style={{ background:'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
              <h3 className="text-sm font-medium text-white mb-1.5">{L.ready_t}</h3>
              <p className="text-xs text-green-200 leading-relaxed mb-4">
                {L.ready_d}
              </p>
              <div className="flex items-center gap-2 text-xs text-green-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                {L.ready_s}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}


// ── Loading Screen ───────────────────────────────────────
const LoadingScreen = () => {
  const { L } = useLang()
  return (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <SpinnerIcon/>
    <p className="text-sm text-gray-500">{L.loading}</p>
  </div>
  )
}


// ── Status config ────────────────────────────────────────
const STATUS_CONFIG = {
  pending  : { label:'Pending',   cls:'bg-gray-100 text-gray-600'    },
  sent     : { label:'Sent',      cls:'bg-blue-50 text-blue-700'     },
  viewed   : { label:'Viewed',    cls:'bg-purple-50 text-purple-700' },
  interview: { label:'Interview', cls:'bg-yellow-50 text-yellow-700' },
  accepted : { label:'Accepted',  cls:'bg-green-50 text-green-700'   },
  rejected : { label:'Rejected',  cls:'bg-red-50 text-red-500'       },
}


// ── Application History ──────────────────────────────────
const ApplicationHistory = ({ cvId, onClose }) => {
  const { L } = useLang()
  const [apps,    setApps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!cvId) return
    setLoading(true)
    getApplicationHistory(cvId)
      .then(res => setApps(res.data))
      .catch(()  => setError(L.hist_err))
      .finally(()=> setLoading(false))
  }, [cvId])

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus)
      setApps(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: newStatus } : a))
    } catch {
      alert('Failed to update status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-medium text-gray-800">{L.hist_t}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{apps.length} {apps.length !== 1 ? L.hist_app_p : L.hist_app_s}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
        </div>

        <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400 text-sm"><SpinnerIcon/> {L.hist_loading}</div>
          ) : error ? (
            <div className="text-center py-16 text-sm text-red-400">{error}</div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium text-gray-600 mb-1">{L.hist_empty_t}</p>
              <p className="text-xs text-gray-400">{L.hist_empty_s}</p>
            </div>
          ) : (
            apps.map((app) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
              return (
                <div key={app.application_id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-800">{app.job.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{app.job.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{L.hist_applied} {new Date(app.applied_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                        {app.score && <span className="text-xs text-blue-600 font-medium">{Math.round(app.score * 100)}% {L.hist_match}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.application_id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                          <option key={val} value={val}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.job.requirements.split(',').slice(0, 5).map((req, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{req.trim().split('.')[0].trim()}</span>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {apps.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-6">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = apps.filter(a => a.status === status).length
                if (count === 0) return null
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-500 font-medium">{count}</span>
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


// ── Jobs Database ────────────────────────────────────────
const JobsDatabase = ({ onClose, cvData, onSelectJob }) => {
  const { L } = useLang()
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
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-6xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-medium text-gray-800">{L.db_t}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} {L.db_avail}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">✕</button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder={L.db_search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 bg-gray-50"
          />
        </div>

        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><SpinnerIcon/> {L.db_loading}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">{L.db_no}</div>
          ) : (
            filtered.map((job, i) => (
              <div key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{(page-1)*20+i+1}</span>
                      <h3 className="text-sm font-medium text-gray-800 truncate">{job.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{job.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.split(',').slice(0, 4).map((req, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{req.trim().split('.')[0].trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {cvData && (
                      <button
                        onClick={() => { onSelectJob(job); onClose() }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors whitespace-nowrap"
                      >
                        {L.db_analyze}
                      </button>
                    )}
                    <span className="text-xs text-gray-300 text-center">{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{L.db_page} {page} {L.db_of} {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">{L.db_prev}</button>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">{L.db_next}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ── CV Library ───────────────────────────────────────────
const CVLibrary = ({ onSelectCV, currentCvId }) => {
  const { L } = useLang()
  const [cvs,      setCvs]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    getAllCVs()
      .then(res => setCvs(res.data))
      .finally(() => setLoading(false))
  }, [currentCvId])

  const handleDelete = async (cv, e) => {
    e.stopPropagation()
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
    <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-xs"><SpinnerIcon/> {L.hist_loading}</div>
  )
  if (cvs.length === 0) return (
    <div className="text-center py-8 text-xs text-gray-400">{L.cv_no_cvs}</div>
  )

  return (
    <div className="space-y-2">
      {cvs.map(cv => {
        const isActive   = cv.id === currentCvId
        const isDeleting = deleting === cv.id
        const date = new Date(cv.uploaded_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

        return (
          <div key={cv.id} className={`p-3 rounded-xl border-2 transition-all duration-150 ${isActive?'border-blue-500 bg-blue-50':'border-gray-200 bg-white hover:border-blue-300'}`}>
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${isActive?'bg-blue-600 text-white':'bg-gray-100 text-gray-500'}`}><FileIcon/></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate leading-tight mb-0.5">{cv.filename}</p>
                <p className="text-xs text-gray-400">{date}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${cv.has_text?'bg-green-50 text-green-600':'bg-red-50 text-red-400'}`}>
                    {cv.has_text ? L.cv_extracted : L.cv_no_text}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex gap-2">
              {isActive ? (
                <div className="flex-1 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium text-center">{L.cv_active}</div>
              ) : (
                <button
                  onClick={() => onSelectCV(cv)}
                  disabled={!cv.has_text || isDeleting}
                  className="flex-1 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-40 transition-colors"
                >
                  {L.cv_use}
                </button>
              )}
              <button
                onClick={(e) => handleDelete(cv, e)}
                disabled={isDeleting}
                className="w-7 h-7 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
                title="Delete CV"
              >
                {isDeleting ? <SpinnerIcon/> : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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


// ── Auth Modal ───────────────────────────────────────────
const AuthModal = ({ mode: initialMode, onClose, onSuccess }) => {
  const { L } = useLang()
  const [mode,    setMode]    = useState(initialMode)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [password,setPassword]= useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let res
      if (mode === 'register') {
        if (!name.trim()) { setError('Vui lòng nhập họ tên'); setLoading(false); return }
        res = await registerUser(name.trim(), email, password)
      } else {
        res = await loginUser(email, password)
      }
      localStorage.setItem('cv_token', res.data.token)
      onSuccess(res.data.user)
    } catch (err) {
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-800">
            {mode === 'login' ? L.auth_login : L.auth_register}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><XIcon/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.auth_name}</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Nguyễn Văn A"
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.auth_email}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.auth_pass}</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertIcon/> {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-full bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><SpinnerIcon/> {L.auth_proc}</> : mode === 'login' ? L.auth_login : L.auth_register}
          </button>

          <p className="text-xs text-center text-gray-400">
            {mode === 'login' ? L.auth_no_acc : L.auth_has_acc}{' '}
            <button type="button" onClick={() => { setMode(mode==='login'?'register':'login'); setError('') }}
              className="text-blue-600 hover:underline font-medium">
              {mode === 'login' ? L.auth_reg_now : L.auth_login_lnk}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}


// ── Apply Modal ──────────────────────────────────────────
const ApplyModal = ({ target, cvData, currentUser, onClose, onSuccess }) => {
  const { L } = useLang()
  const { job, source } = target

  const jobTitle    = source === 'database' ? job.title    : job.position
  const companyName = job.company || ''
  const score       = job.score || 0
  const jdId        = source === 'database' ? job.id : null
  const remoteUrl   = source === 'remoteok'  ? job.url : null

  // Auto-fill employer email: từ DB job.email, hoặc remote job.employer_email
  const autoEmployerEmail = source === 'database'
    ? (job.email || '')
    : (job.employer_email || '')

  const [form,    setForm]    = useState({
    name         : currentUser?.name  || '',
    email        : currentUser?.email || '',
    employerEmail: autoEmployerEmail,
    coverMessage : '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())          { setError('Vui lòng nhập họ tên'); return }
    if (!form.email.trim())         { setError('Vui lòng nhập email'); return }
    if (!form.employerEmail.trim()) { setError('Vui lòng nhập email nhà tuyển dụng'); return }

    setLoading(true)
    setError('')
    try {
      await applyWithEmail({
        cv_id          : cvData.id,
        jd_id          : jdId,
        applicant_name : form.name.trim(),
        applicant_email: form.email.trim(),
        employer_email : form.employerEmail.trim(),
        job_title      : jobTitle,
        company_name   : companyName,
        matching_score : score,
        cover_message  : form.coverMessage.trim(),
        source         : source,
        remote_job_url : remoteUrl,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể gửi hồ sơ, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const pct = Math.round(score * 100)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-medium text-gray-800">{L.apl_t}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{L.apl_sub}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><XIcon/></button>
        </div>

        {/* Job info */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{jobTitle}</p>
              <p className="text-xs text-gray-400 mt-0.5">{companyName || '—'}</p>
              {source === 'remoteok' && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-500 mt-1"><GlobeIcon/> Remote · {job.location}</span>
              )}
            </div>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${pct>=70?'bg-green-50 text-green-700':pct>=40?'bg-yellow-50 text-yellow-700':'bg-red-50 text-red-500'}`}>
              {pct}%
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.apl_name} <span className="text-red-400">*</span></label>
            <input
              type="text" value={form.name} onChange={set('name')} required
              placeholder="Nguyễn Văn A"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.apl_email} <span className="text-red-400">*</span></label>
            <input
              type="email" value={form.email} onChange={set('email')} required
              placeholder="your@email.com"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              {L.apl_emp_email} <span className="text-red-400">*</span>
              {autoEmployerEmail && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-normal">
                  {L.apl_auto}
                </span>
              )}
            </label>
            <input
              type="email" value={form.employerEmail} onChange={set('employerEmail')} required
              placeholder="hr@company.com"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{L.apl_msg} <span className="text-gray-300">{L.apl_msg_opt}</span></label>
            <textarea
              value={form.coverMessage} onChange={set('coverMessage')}
              rows={3}
              placeholder={L.apl_msg_ph}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertIcon/> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {L.apl_cancel}
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><SpinnerIcon/> {L.apl_sending}</> : <><SendIcon/> {L.apl_submit}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ── Toast ────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
      ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
      {toast.type === 'success' ? <CheckIcon size={16}/> : <AlertIcon/>}
      {toast.msg}
    </div>
  )
}


// ── Main App ─────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('cv_lang') || 'vi')
  const L = I18N[lang]
  const handleLangChange = (l) => {
    setLang(l)
    localStorage.setItem('cv_lang', l)
  }

  const [step,        setStep]        = useState(0)
  const [cvData,      setCvData]      = useState(null)
  const [jobs,        setJobs]        = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [fetching,    setFetching]    = useState(false)
  const [showDB,      setShowDB]      = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cv_user')) } catch { return null }
  })
  const [showAuth,    setShowAuth]    = useState(null) // 'login' | 'register' | null

  // Apply modal state
  const [applyTarget, setApplyTarget] = useState(null) // { job, source }
  const [toast,       setToast]       = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogin = (user) => {
    setCurrentUser(user)
    localStorage.setItem('cv_user', JSON.stringify(user))
    setShowAuth(null)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('cv_user')
    localStorage.removeItem('cv_token')
  }

  const handleOpenApply = (job, source = 'database') => {
    if (!cvData) { showToast('error', 'Vui lòng upload CV trước'); return }
    setApplyTarget({ job, source })
  }

  const handleApplySuccess = () => {
    setApplyTarget(null)
    showToast('success', 'Đã gửi hồ sơ ứng tuyển. Email sẽ được gửi đến nhà tuyển dụng.')
  }

  const handleUploadSuccess = async (cv) => {
    setCvData(cv)
    setFetching(true)
    try {
      const { data } = await matchJobs(cv.id)
      setJobs(data)
      setStep(1)
    } catch (err) {
      console.error('matchJobs error:', err)
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
    <LangContext.Provider value={{ lang, setLang: handleLangChange, L }}>
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-medium text-xs">CV</div>
            <span className="font-medium text-gray-800 text-sm">CV Matching</span>
          </div>

          <Steps current={step}/>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDB(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
              {L.nav_browse}
            </button>

            {cvData && (
              <button
                onClick={() => setShowHistory(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                {L.nav_history}
              </button>
            )}

            {/* Language toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {['vi', 'en'].map(l => (
                <button key={l} onClick={() => handleLangChange(l)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                    ${lang === l ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                </button>
              ))}
            </div>

            {/* Auth buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                  <UserIcon/> {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {L.nav_logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuth('login')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {L.nav_login}
                </button>
                <button
                  onClick={() => setShowAuth('register')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                >
                  {L.nav_register}
                </button>
              </div>
            )}

            {step > 0 && (
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                {L.nav_start_over}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {fetching && <LoadingScreen/>}

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
            onApply={handleOpenApply}
          />
        )}

        {!fetching && step === 2 && selectedJob && (
          <AnalysisScreen
            cvData={cvData}
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={handleSelectJob}
            onBack={() => setStep(1)}
            onApply={handleOpenApply}
          />
        )}
      </main>

      {/* Modals & overlays */}
      {showDB && (
        <JobsDatabase
          onClose={() => setShowDB(false)}
          cvData={cvData}
          onSelectJob={async (job) => {
            setShowDB(false)
            if (!cvData) { alert('Please upload your CV first!'); return }
            setFetching(true)
            try {
              const { data: matchedJobs } = await matchJobs(cvData.id, 10)
              const matched = matchedJobs.find(j => j.id === job.id)
              if (matched) {
                setJobs(matchedJobs)
                setSelectedJob(matched)
              } else {
                const { data: allMatched } = await matchJobs(cvData.id, 100)
                const foundInAll = allMatched.find(j => j.id === job.id)
                setJobs(matchedJobs)
                setSelectedJob(foundInAll || { ...job, score: 0, label: 'No Fit' })
              }
              setStep(2)
            } finally {
              setFetching(false)
            }
          }}
        />
      )}

      {showHistory && (
        <ApplicationHistory cvId={cvData?.id} onClose={() => setShowHistory(false)}/>
      )}

      {showAuth && (
        <AuthModal
          mode={showAuth}
          onClose={() => setShowAuth(null)}
          onSuccess={handleLogin}
        />
      )}

      {applyTarget && (
        <ApplyModal
          target={applyTarget}
          cvData={cvData}
          currentUser={currentUser}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      <Toast toast={toast}/>
    </div>
    </LangContext.Provider>
  )
}
