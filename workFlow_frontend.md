# 🔄 Luồng Hoạt Động Frontend - Chi Tiết End-to-End

## 📱 Overview - Tổng Quan Luồng

```
User truy cập http://localhost:3000/
          ↓
App khởi tạo (main.jsx)
          ↓
Check localStorage xem có token không
          ↓
Nếu có token → hiển thị Upload CV
Nếu không → hiển thị Login/Register
          ↓
User upload CV
          ↓
Backend xử lý (extract text + embedding)
          ↓
Frontend nhận CV data
          ↓
Gọi matchJobs API
          ↓
Frontend nhận danh sách top 10 jobs
          ↓
User click job để xem chi tiết
          ↓
Frontend hiển thị AnalysisPanel
          ↓
User click "Phân tích CV vs JD"
          ↓
Backend gọi RAG (OpenAI)
          ↓
Frontend hiển thị analysis output
          ↓
User click "Ứng tuyển"
          ↓
Frontend gọi applyJob API
          ↓
Application saved to database
          ↓
User thấy success notification
```

---

## 🎬 Scene 1: App Initialization (Khởi Tạo)

### **1.1 User truy cập URL**

```
User gõ: http://localhost:3000/
          ↓
Browser load index.html
          ↓
index.html có <div id="root"></div>
```

### **1.2 React mounts**

```javascript
// main.jsx
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}/>
      <Route path="/admin" element={<AdminApp/>}/>
    </Routes>
  </BrowserRouter>
)
```

**Kết quả:** React render App component vào `<div id="root">`

### **1.3 App.jsx useEffect runs**

```javascript
// App.jsx - Dòng ~300
useEffect(() => {
  // Lần đầu component mount
  const saved = localStorage.getItem('cv_user')
  if (saved) {
    const user = JSON.parse(saved)
    setUser(user)
    setIsLoggedIn(true)
  }
}, [])
```

**Kết quả:**
- ✅ Nếu có token → `isLoggedIn = true`
- ❌ Nếu không → `isLoggedIn = false`

---

## 🚪 Scene 2: Auth Gate - Kiểm Tra Đăng Nhập

### **2.1 Check state**

```javascript
// App.jsx render logic
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [screen, setScreen] = useState('gate')
  
  // ...
  
  if (!isLoggedIn) {
    return <LoginRegisterScreen/>  // Hiển thị login gate
  }
  
  // Nếu đã login → hiển thị app
  if (screen === 'upload') return <UploadScreen/>
  if (screen === 'results') return <ResultsScreen/>
  // ...
}
```

### **2.2 Nếu chưa login: LoginRegisterScreen**

```
┌─────────────────────────────────────────┐
│      CV Matching System                  │
│                                          │
│  "Your CV. Your jobs. Completely private"│
│                                          │
│  [Sign in to get started] button         │
│  [Create free account] button            │
└─────────────────────────────────────────┘
```

**User có 2 lựa chọn:**

#### **Option A: Đăng Nhập (Login)**

```javascript
const handleLogin = async (email, password) => {
  try {
    const res = await loginUser(email, password)
    // res.data = { access_token, user: { id, name, email } }
    
    localStorage.setItem('cv_token', res.data.access_token)
    localStorage.setItem('cv_user', JSON.stringify(res.data.user))
    
    setToken(res.data.access_token)
    setUser(res.data.user)
    setIsLoggedIn(true)
    setScreen('upload')  // Chuyển sang upload screen
  } catch (error) {
    setError('Email hoặc mật khẩu sai!')
  }
}
```

**Flow:**
1. User nhập email & password
2. Click "Đăng nhập"
3. Frontend call `loginUser(email, password)` API
4. Backend verify credentials
5. Backend return JWT token
6. Frontend lưu token + user info vào localStorage
7. Frontend set `isLoggedIn = true`
8. Component re-render → hiển thị upload screen

#### **Option B: Đăng Ký (Register)**

```javascript
const handleRegister = async (name, email, password) => {
  try {
    await registerUser(name, email, password)
    // Backend tạo user mới
    
    setScreen('login')  // Chuyển sang login screen
    setMessage('Đăng ký thành công! Vui lòng đăng nhập')
  } catch (error) {
    setError('Email đã tồn tại!')
  }
}
```

**Flow:**
1. User nhập name, email, password
2. Click "Đăng ký"
3. Frontend call `registerUser(name, email, password)` API
4. Backend create user mới
5. Frontend chuyển sang login screen
6. User đăng nhập

---

## 📤 Scene 3: Upload CV

### **3.1 User thấy UploadScreen**

```
┌─────────────────────────────────────┐
│  Find your perfect job with AI       │
│  precision                           │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ 🔼 Drag & drop CV here       │  │
│  │    or click to browse         │  │
│  └───────────────────────────────┘  │
│                                      │
│  Supported: PDF, DOCX (Max 10MB)    │
└─────────────────────────────────────┘
```

### **3.2 User drag-and-drop CV**

```javascript
// UploadCV.jsx
const onDrop = useCallback(async (acceptedFiles) => {
  const file = acceptedFiles[0]
  
  setFilename(file.name)
  setStatus('uploading')
  
  try {
    const res = await uploadCV(file)
    // res.data = { id, raw_text, embedding }
    
    setStatus('success')
    onUploadSuccess(res.data)  // Callback từ App.jsx
  } catch (err) {
    setStatus('error')
    setError(err.response?.data?.detail)
  }
}, [onUploadSuccess])
```

**Khoảng thời gian xảy ra:**
```
User drop file
       ↓ (0ms)
setStatus('uploading')
       ↓
Frontend gọi uploadCV(file) API
       ↓ (2-5s) Backend xử lý:
       ├─ Extract text từ PDF/DOCX
       ├─ Generate embedding (768-dim vector)
       └─ Save vào database
       ↓
Backend return { id, raw_text, embedding, ... }
       ↓ (0ms)
setStatus('success')
       ↓
onUploadSuccess(res.data)
       ├─ setCurrentCV(res.data)
       ├─ matchJobs(res.data.id)  ← Tìm jobs!
       └─ setScreen('results')
```

### **3.3 UI hiển thị upload states**

```javascript
{status === 'idle' && (
  <>
    <Upload size={48}/>
    <p>Kéo thả CV vào đây</p>
  </>
)}

{status === 'uploading' && (
  <>
    <Loader className="animate-spin" size={48}/>
    <p>Đang xử lý {filename}...</p>
    <p>Đang trích xuất text & tạo embedding</p>
  </>
)}

{status === 'success' && (
  <>
    <CheckCircle className="text-green-500" size={48}/>
    <p>Upload thành công!</p>
    <p>{filename}</p>
  </>
)}

{status === 'error' && (
  <>
    <p className="text-red-600">Upload thất bại!</p>
    <p className="text-red-500">{error}</p>
  </>
)}
```

---

## 🔍 Scene 4: Matching Jobs

### **4.1 Frontend call matchJobs API**

```javascript
// App.jsx - handleUploadCV
const handleUploadCV = async (cvData) => {
  setCurrentCV(cvData)
  setLoading(true)
  
  try {
    const res = await matchJobs(cvData.id, topK=10)
    // res.data = [
    //   { id, title, description, requirements, score, label },
    //   { ... },
    //   ...
    // ]
    
    setResults(res.data)
    setScreen('results')  // Chuyển sang results screen
  } catch (error) {
    setError('Tìm job thất bại!')
  } finally {
    setLoading(false)
  }
}
```

**Backend xử lý (2-3s):**
```
Backend nhận cvData.id
    ↓
Lấy CV embedding từ database
    ↓
Lấy tất cả JD embeddings từ database
    ↓
Tính cosine_similarity(cv_embedding, jd_embedding) cho mỗi JD
    ↓
Sort by similarity descending
    ↓
Lấy top 10
    ↓
Gán label (Good Fit / Potential Fit / No Fit) dựa vào score
    ↓
Return array 10 jobs
```

### **4.2 Frontend hiển thị Results**

```
┌──────────────────────────────────────────┐
│  Top 10 matching jobs                    │
│  Based on AI analysis of your CV         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  #1  Senior Backend Developer    ⭐       │
│       Good Fit                    85%    │
│       [████████░░░░░░░░░░░░░░]          │
│       Có kinh nghiệm Python, AWS...     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  #2  DevOps Engineer              📈     │
│       Potential Fit                68%   │
│       [██████░░░░░░░░░░░░░░░░░░░░]      │
│       Cần Docker, Kubernetes...        │
└──────────────────────────────────────────┘

... (tới #10)
```

**Code:**
```javascript
// ResultsScreen
{results.map((job, i) => (
  <JobCard
    key={job.id}
    job={job}
    rank={i + 1}
    onSelect={handleSelectJob}
    isSelected={selectedJob?.id === job.id}
  />
))}
```

---

## 🔎 Scene 5: Select Job & View Details

### **5.1 User click một JobCard**

```javascript
const handleSelectJob = (job) => {
  setCurrentJD(job)
  setSelectedJob(job)
  // Không chuyển screen, vẫn ở results view
  // Hiển thị AnalysisPanel bên cạnh
}
```

### **5.2 AnalysisPanel hiển thị**

```
┌───────────────────────────────────┐
│ Senior Backend Developer          │
│ Match score: 85%                  │
│                                   │
│ Job description: ...              │
│ [▼ View requirements]             │
│                                   │
│ ┌─────────────────────────────┐  │
│ │ 🔍 Analyze CV vs JD         │  │
│ │ (Đang chờ user click)       │  │
│ └─────────────────────────────┘  │
└───────────────────────────────────┘
```

**State:**
```javascript
// AnalysisPanel.jsx
const [analysis, setAnalysis] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [showFull, setShowFull] = useState(false)
```

---

## 🤖 Scene 6: Analyze Job (RAG Processing)

### **6.1 User click "Phân tích CV vs JD"**

```javascript
const handleAnalyze = async () => {
  setLoading(true)
  setError('')
  
  try {
    const res = await analyzeJob(job.id, cvId, language='vi')
    // res.data = {
    //   overall_assessment: "...",
    //   match_percentage: 85.0,
    //   strengths: [
    //     { skill: "Python", detail: "..." },
    //     { skill: "AWS", detail: "..." }
    //   ],
    //   missing_skills: [
    //     { skill: "Kubernetes", importance: "high", suggestion: "..." }
    //   ],
    //   recommendations: ["Học Kubernetes", "..."],
    //   verdict: "Good Fit"
    // }
    
    setAnalysis(res.data)  // Lưu output
  } catch (error) {
    setError('Phân tích thất bại!')
  } finally {
    setLoading(false)
  }
}
```

**Backend xử lý (3-5s):**
```
Backend nhận cvId, jdId, language
    ↓
Lấy CV raw_text từ database
    ↓
Lấy JD (title, description, requirements) từ database
    ↓
Tính match_score từ embedding (cosine similarity)
    ↓
Gọi RAG Service:
  ├─ Nếu có OpenAI API key:
  │  ├─ Gọi OpenAI GPT-4o Mini
  │  ├─ Parse JSON response
  │  ├─ setdefault() các field bị thiếu
  │  └─ Return AnalysisResponse
  └─ Nếu không có API key:
     └─ Dùng rule-based fallback
    ↓
Return AnalysisResponse JSON
```

### **6.2 Frontend hiển thị Analysis Output**

```
Loading state (3-5s):
┌──────────────────────────┐
│ 🔄 Analyzing...          │
│    (spinner spinning)    │
└──────────────────────────┘

Success state:
┌──────────────────────────────────┐
│ 📋 Overall Assessment             │
│ ┌──────────────────────────────┐ │
│ │ Ứng viên phù hợp 85% với     │ │
│ │ yêu cầu vị trí Senior...      │ │
│ └──────────────────────────────┘ │
│                                  │
│ ✅ Strengths                      │
│ • Python: Kinh nghiệm thực tế   │
│ • AWS: Làm 3 năm                │
│                                  │
│ ⚠️ Skills to Improve              │
│ • Kubernetes [HIGH]              │
│   Suggestion: Học qua courses   │
│                                  │
│ 💡 Recommendations               │
│ → Tập trung học Kubernetes       │
│ → Bổ sung dự án thực tế          │
│                                  │
│ [🎯 Apply Now]                   │
└──────────────────────────────────┘
```

**Code:**
```javascript
{analysis && (
  <div>
    {/* Overall */}
    <div className="p-4 bg-blue-50">
      <p>{analysis.overall_assessment}</p>
    </div>
    
    {/* Strengths */}
    {analysis.strengths?.length > 0 && (
      <div>
        <h4>✅ Strengths</h4>
        {analysis.strengths.map(s => (
          <div key={s.skill}>
            <span>{s.skill}:</span>
            <span>{s.detail}</span>
          </div>
        ))}
      </div>
    )}
    
    {/* Missing Skills */}
    {analysis.missing_skills?.length > 0 && (
      <div>
        <h4>⚠️ Skills to Improve</h4>
        {analysis.missing_skills.map(s => (
          <div key={s.skill}>
            <span>{s.skill}</span>
            <span className={s.importance === 'high' ? 'text-red' : ''}>{s.importance}</span>
            <p>{s.suggestion}</p>
          </div>
        ))}
      </div>
    )}
    
    {/* Recommendations */}
    {analysis.recommendations?.length > 0 && (
      <div>
        <h4>💡 Recommendations</h4>
        <ul>
          {analysis.recommendations.map((r, i) => (
            <li key={i}>→ {r}</li>
          ))}
        </ul>
      </div>
    )}
    
    {/* Apply Button */}
    <button onClick={handleApply}>
      {applied ? '✅ Đã ứng tuyển!' : '🎯 Apply Now'}
    </button>
  </div>
)}
```

---

## 📝 Scene 7: Apply for Job

### **7.1 User click "Apply Now"**

```javascript
const handleApply = async () => {
  setApplying(true)
  
  try {
    const res = await applyJob(job.id, cvId)
    // Backend tạo Application record
    
    setApplied(true)
    setMessage('Ứng tuyển thành công!')
  } catch (error) {
    setError('Ứng tuyển thất bại!')
  } finally {
    setApplying(false)
  }
}
```

**Backend xử lý:**
```
Backend nhận jdId, cvId
    ↓
Verify CV & JD tồn tại
    ↓
Create Application record:
  ├─ cv_id
  ├─ jd_id
  ├─ user_id
  ├─ match_score
  ├─ analysis_result
  ├─ status: 'applied'
  └─ created_at
    ↓
Save vào database
    ↓
Return success response
```

### **7.2 UI Update**

```javascript
{applied ? (
  <button disabled className="bg-green-100">
    ✅ Đã ứng tuyển!
  </button>
) : (
  <button onClick={handleApply}>
    🎯 Apply Now
  </button>
)}
```

---

## 📊 Scene 8: View Application History

### **8.1 User click "Lịch sử ứng tuyển"**

```javascript
// App.jsx
const handleViewHistory = async () => {
  setLoading(true)
  try {
    const res = await getApplicationHistory(currentCV.id)
    // res.data = [
    //   { id, jd_id, job_title, match_score, status, created_at },
    //   { ... }
    // ]
    
    setApplications(res.data)
    setScreen('history')
  } finally {
    setLoading(false)
  }
}
```

### **8.2 Hiển thị History**

```
┌────────────────────────────────────────┐
│ Application History                    │
│ 5 applications total                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Senior Backend Developer              │
│ Match: 85% • Applied 2 days ago       │
│ Status: [Applied]                     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ DevOps Engineer                        │
│ Match: 68% • Applied 1 week ago       │
│ Status: [Under Review]                │
└────────────────────────────────────────┘

(... more)
```

---

## 🌍 Scene 9: Browse Remote Jobs (Optional)

### **9.1 User click "Remote Jobs" tab**

```javascript
const handleFindRemoteJobs = async () => {
  setLoading(true)
  try {
    const res = await matchRemoteJobs(currentCV.id, country=null)
    // Fetch từ RemoteOK.com
    // Match với CV embeddings
    // Return top 10 remote jobs
    
    setRemoteResults(res.data)
    setScreen('remote')
  } finally {
    setLoading(false)
  }
}
```

**Tương tự như local jobs, nhưng:**
- ✅ Data từ RemoteOK.com (real-time)
- ✅ Support filter by country
- ✅ Apply redirect to RemoteOK site

---

## 🏢 Scene 10: Admin Panel (Separate Flow)

### **10.1 Access Admin Panel**

```
User truy cập: http://localhost:3000/admin
    ↓
AdminApp.jsx mount
    ↓
Check localStorage.getItem('admin_token')
    ↓
Nếu không có → hiển thị LoginScreen
Nếu có → hiển thị Dashboard
```

### **10.2 Admin Login**

```javascript
const handleLogin = async (email, password) => {
  try {
    const res = await adminLogin(email, password)
    // res.data = { access_token }
    
    localStorage.setItem('admin_token', res.data.access_token)
    setIsLoggedIn(true)
  } catch {
    setError('Invalid credentials')
  }
}
```

### **10.3 Admin Dashboard**

Hiển thị:
- 📊 Stats: Total JDs, CVs, Applications, Employers
- 📈 Charts: Applications by status
- ⚙️ Sections: Jobs Manager, Employer Manager, Applications Manager

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APP INITIALIZATION                        │
│  User → Browser → main.jsx → App.jsx useEffect              │
└─────────────────────────────┬───────────────────────────────┘
                              ↓
                   ┌──────────────────┐
                   │ Token in localStorage? │
                   └────┬─────────┬────┘
                  YES   │         │   NO
                   ┌────▼──┐  ┌──▼─────┐
                   │ Upload │  │ Login  │
                   │ Screen │  │ Screen │
                   └────┬──┘  └──┬─────┘
                        │       │
                        ├──────┘
                        ↓
              ┌──────────────────────┐
              │  UploadCV Component   │
              │  (drag & drop)        │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  uploadCV() API call   │
              │  (2-5s processing)    │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ matchJobs() API call  │
              │ (2-3s processing)    │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  ResultsScreen        │
              │  Top 10 JobCards      │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ User click JobCard    │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ AnalysisPanel shows   │
              │ Job details           │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ User click Analyze    │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ analyzeJob() API call │
              │ (3-5s RAG processing)│
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ Show Analysis Output  │
              │ - Overall assessment  │
              │ - Strengths           │
              │ - Missing skills      │
              │ - Recommendations     │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ User click Apply      │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ applyJob() API call   │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ Show success message  │
              │ "Đã ứng tuyển!"       │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │ Can view history      │
              │ Can apply more jobs   │
              │ Can upload new CV     │
              └──────────────────────┘
```

---

## ⏱️ Timeline Thực Tế

```
0ms     - User truy cập http://localhost:3000/
100ms   - React khởi tạo, load App component
200ms   - Check localStorage
250ms   - Hiển thị Upload screen
500ms   - User drag CV file

500ms   - Upload button active
550ms   - API call uploadCV() gửi
600ms   - Backend nhận file

600ms   - Extract text (OCR nếu cần)
1000ms  - Generate embedding
2000ms  - Save vào database
2100ms  - Backend return response

2150ms  - Frontend nhận CV data
2200ms  - matchJobs() API call
2250ms  - Backend tính similarity

2250ms  - Cosine similarity ×N JDs
3000ms  - Sort & return top 10
3100ms  - Frontend nhận results

3150ms  - setResults() state update
3200ms  - Component re-render
3250ms  - User thấy top 10 jobs

3500ms  - User click job #1
3550ms  - AnalysisPanel hiển thị

3600ms  - User click "Analyze"
3650ms  - analyzeJob() API call
3700ms  - Backend tính match_score

3700ms  - Call OpenAI API
5000ms  - OpenAI return analysis
5050ms  - Parse JSON response
5100ms  - setdefault() fields

5150ms  - Return to frontend
5200ms  - Frontend lưu analysis
5250ms  - Component re-render
5300ms  - User thấy analysis output

5600ms  - User click "Apply"
5650ms  - applyJob() API call
5700ms  - Backend create Application

5750ms  - setApplied(true)
5800ms  - Show success message
5900ms  - User can apply another job
```

---

## 🔑 Key State Management

```javascript
// Main state (App.jsx)
const [isLoggedIn, setIsLoggedIn]      // Auth state
const [user, setUser]                  // User info
const [token, setToken]                // JWT token
const [language, setLanguage]          // EN/VI
const [currentCV, setCurrentCV]        // Selected CV
const [currentJD, setCurrentJD]        // Selected JD
const [results, setResults]            // Top 10 jobs
const [screen, setScreen]              // Current screen
const [loading, setLoading]            // Loading indicator
const [error, setError]                // Error message

// AnalysisPanel state
const [analysis, setAnalysis]          // RAG output
const [loading, setLoading]            // Analyzing...
const [applying, setApplying]          // Sending apply...
const [applied, setApplied]            // Applied status
```

---

## 🎓 Tóm Tắt Luồng

1. **Initialization** - App mount, check token, show login/upload
2. **Authentication** - Login/Register, save token to localStorage
3. **Upload CV** - Drag-drop file, backend extract + embed
4. **Match Jobs** - Frontend call matchJobs, show top 10
5. **Select Job** - User click card, show AnalysisPanel
6. **Analyze** - Call RAG API, show analysis output
7. **Apply** - User click apply, create Application record
8. **History** - View all applications
9. **Admin** - Separate panel for managing jobs/employers

**Total time: ~5-6 seconds từ upload đến thấy analysis output!** ⚡