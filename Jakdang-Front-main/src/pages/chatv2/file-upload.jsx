"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { FileIcon, ImageIcon, Loader2, Paperclip, X, FileVideo } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from "react"

// 파일 크기 포맷팅 함수
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 파일 타입 확인 함수
function getFileType(file) {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "file"
}

export function FileUpload({ onFileSelect, disabled = false, maxFileSize = 50 * 1024 * 1024 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsDragging(true)
      }
    },
    [isDragging],
  )

  // 파일 처리 함수
  const processFiles = useCallback(
    (fileList) => {
      const newFiles = Array.from(fileList).map((file) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: getFileType(file),
        progress: 0,
        error: file.size > maxFileSize ? `파일 크기가 너무 큽니다 (최대 ${formatFileSize(maxFileSize)})` : null,
      }))

      setFiles((prev) => [...prev, ...newFiles])
    },
    [maxFileSize],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles],
  )

  // 파일 입력 변경 핸들러
  const handleFileInputChange = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
    },
    [processFiles],
  )

  // 파일 제거 핸들러
  const removeFile = useCallback((fileId) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }, [])

  // 파일 업로드 시뮬레이션
  const simulateUpload = useCallback(() => {
    if (files.length === 0) return

    setIsUploading(true)

    // 각 파일에 대한 초기 진행률 설정
    const initialProgress = {}
    files.forEach((file) => {
      if (!file.error) {
        initialProgress[file.id] = 0
      }
    })
    setUploadProgress(initialProgress)

    // 파일별 업로드 시뮬레이션
    const uploadIntervals = {}

    files.forEach((file) => {
      if (file.error) return

      uploadIntervals[file.id] = setInterval(() => {
        setUploadProgress((prev) => {
          const currentProgress = prev[file.id] || 0
          const newProgress = Math.min(currentProgress + Math.random() * 10, 100)

          // 업로드 완료 시 인터벌 정리
          if (newProgress >= 100) {
            clearInterval(uploadIntervals[file.id])
          }

          return { ...prev, [file.id]: newProgress }
        })
      }, 200)
    })

    // 모든 파일 업로드 완료 확인
    const checkAllCompleted = setInterval(() => {
      let allCompleted = true

      setUploadProgress((prev) => {
        Object.entries(prev).forEach(([id, progress]) => {
          if (progress < 100) {
            allCompleted = false
          }
        })
        return prev
      })

      if (allCompleted) {
        clearInterval(checkAllCompleted)

        // 업로드 완료 후 처리
        setTimeout(() => {
          // 에러가 없는 파일만 선택
          const validFiles = files.filter((file) => !file.error).map((file) => file.file)

          if (onFileSelect && validFiles.length > 0) {
            onFileSelect(validFiles)
          }

          setIsUploading(false)
          setIsOpen(false)
          setFiles([])
        }, 500)
      }
    }, 300)

    // 클린업 함수
    return () => {
      Object.values(uploadIntervals).forEach((interval) => clearInterval(interval))
      clearInterval(checkAllCompleted)
    }
  }, [files, onFileSelect])

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      // 업로드 중인 모든 작업 취소
      setIsUploading(false)
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "text-gray-400 hover:text-[#0284c7] transition-colors",
            disabled && "text-gray-600 cursor-not-allowed",
          )}
          disabled={disabled}
        >
          <Paperclip size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-[#E0E0E0] text-gray-800">
        <DialogHeader>
          <DialogTitle>파일 업로드</DialogTitle>
          <DialogDescription className="text-gray-400">
            채팅에 첨부할 파일을 선택하세요. 최대 {formatFileSize(maxFileSize)}까지 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "mt-4 border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging ? "border-[#FFC107] bg-[#FFC107]/10" : "border-[#E0E0E0]",
            isUploading && "opacity-50 pointer-events-none",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <Paperclip className="h-10 w-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? "파일을 여기에 놓으세요" : "파일을 끌어다 놓거나 클릭하여 업로드하세요"}
              </p>
              <p className="text-xs text-gray-400 mt-1">이미지, 문서, 비디오 등 (최대 {formatFileSize(maxFileSize)})</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[#F5F5F5] border-[#E0E0E0] text-gray-600 hover:bg-[#FFC107] hover:text-white"
            >
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center p-2 rounded-md bg-[#F5F5F5]",
                  file.error && "border border-red-500/50",
                )}
              >
                <div className="mr-3 p-2 rounded-md bg-[#E0E0E0]">
                  {file.type === "image" ? (
                    <ImageIcon className="h-5 w-5 text-[#0284c7]" />
                  ) : file.type === "video" ? (
                    <FileVideo className="h-5 w-5 text-[#0284c7]" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-[#0284c7]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    {file.error && <span className="ml-2 text-red-400">{file.error}</span>}
                  </div>
                  {!file.error && uploadProgress[file.id] !== undefined && (
                    <Progress
                      value={uploadProgress[file.id]}
                      className="h-1 mt-1 bg-[#E0E0E0]"
                      indicatorClassName="bg-[#0284c7]"
                    />
                  )}
                </div>
                <button
                  className="ml-2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#E0E0E0]"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
            className="bg-transparent border-[#E0E0E0] text-gray-600 hover:bg-[#F5F5F5]"
          >
            취소
          </Button>
          <Button
            onClick={simulateUpload}
            disabled={isUploading || files.length === 0 || files.every((file) => file.error)}
            className="bg-[#0284c7] text-white hover:bg-[#0369a1]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              "업로드"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
