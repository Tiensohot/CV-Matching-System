import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadCV } from '../services/api'
import { Upload, FileText, CheckCircle, Loader } from 'lucide-react'

export default function UploadCV({ onUploadSuccess }) {
  const [status,   setStatus]   = useState('idle')  // idle/uploading/success/error
  const [filename, setFilename] = useState('')
  const [error,    setError]    = useState('')

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFilename(file.name)
    setStatus('uploading')
    setError('')

    try {
      const res = await uploadCV(file)
      setStatus('success')
      onUploadSuccess(res.data)
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.detail || 'Upload thất bại!')
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf'                                          : ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1
  })

  return (
    <div className="max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />

        {status === 'idle' && (
          <>
            <Upload className="mx-auto mb-4 text-gray-400" size={48}/>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Thả file vào đây...' : 'Kéo thả CV vào đây'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Hỗ trợ PDF và Word (.docx)
            </p>
          </>
        )}

        {status === 'uploading' && (
          <>
            <Loader className="mx-auto mb-4 text-blue-500 animate-spin" size={48}/>
            <p className="text-lg font-medium text-gray-700">
              Đang xử lý <span className="font-semibold">{filename}</span>...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Đang trích xuất text và tạo embedding
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48}/>
            <p className="text-lg font-medium text-gray-700">
              Upload thành công!
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
              <FileText size={14}/> {filename}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 text-red-500 text-5xl">✗</div>
            <p className="text-lg font-medium text-red-600">Upload thất bại!</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-1">Click để thử lại</p>
          </>
        )}
      </div>
    </div>
  )
}