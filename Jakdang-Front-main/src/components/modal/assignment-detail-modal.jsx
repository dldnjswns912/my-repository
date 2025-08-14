import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Bookmark, Calendar, Clock, Eye, FileText, Heart, MessageCircle, Paperclip, Share2, Upload } from "lucide-react"
import { useState } from "react"
import AssignmentSubmitConfirmModal from "./assignment-submit-confirm-modal"
import { useAssignmentApi } from "@/service/api/assignmentApi"
import { useFileApi } from "@/service/api/fileApi"
import { useAtomValue } from "jotai"
import { accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms"
import { handleDocumentChange, handleImageFileChange, handleVideoFileChange, sendFileData } from "@/utils/fileUpload"
import { toast } from "sonner"
import {useMediaQuery} from "@/hooks/use-media-query.jsx";

export default function AssignmentDetailModal({ isOpen, onClose, assignment }) {
  const [submissionText, setSubmissionText] = useState("")
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const isMobileH = useMediaQuery("(max-height: 800px)")

  const userInfo = useAtomValue(userInfoAtom);
  const token = useAtomValue(accessTokenAtom);
  const { submitAssignment } = useAssignmentApi();

  if (!assignment) return null

  const handleFileChange = async (e) => {
    const _files = Array.from(e.target.files);
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const maxTotalSize = 10 * 1024 * 1024; // 10MB
    const maxFileCount = 5;

    // 파일 분류
    const images = _files.filter(file => file.type.startsWith("image/"));
    const videos = _files.filter(file => file.type.startsWith("video/"));
    const documents = _files.filter(file => !file.type.startsWith("image/") && !file.type.startsWith("video/"));

    // 현재 선택된 파일 개수
    const currentImageCount = files.filter(file => file.type.startsWith("image")).length;
    const currentVideoCount = files.filter(file => file.type.startsWith("video")).length;
    const currentDocumentFileInfos = files.filter(file => !file.type.startsWith("image") && !file.type.startsWith("video"));
    const currentDocumentCount = currentDocumentFileInfos.length;
    const currentDocumentSize = currentDocumentFileInfos.reduce((sum, file) => sum + file.file.size, 0);

    // 파일 개수 및 크기 제한 체크
    if (currentImageCount + currentVideoCount + images.length + videos.length > 50) {
      toast.error('사진과 동영상은 최대 50개까지 첨부 가능합니다.');
      return;
    }
    if (currentVideoCount + videos.length > 5) {
      toast.error('동영상은 최대 5개까지 선택 가능합니다.');
      return;
    }
    if (currentDocumentCount + documents.length > maxFileCount || currentDocumentSize + documents.reduce((sum, file) => sum + file.size, 0) > maxTotalSize) {
      toast.error('파일은 최대 5개까지, 총 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 파일 처리
    if (images.length > 0) {
      await handleImageFileChange(images, setFiles);
    }
    if (videos.length > 0) {
      await handleVideoFileChange(videos, setFiles);
    }
    if (documents.length > 0) {
      await handleDocumentChange(documents, setFiles);
    }

    e.target.value = null;
  };

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.target.files = e.dataTransfer.files
      handleFileChange(e)
    }
  }

  const handleSubmit = () => {
    setIsConfirmModalOpen(true)
  }

  const confirmSubmit = async () => {
    setIsConfirmModalOpen(false)
    setIsSubmitting(true)

    try {
      // 파일 업로드
      const uploadedFileIds = [];
      for (const fileInfo of files) {
        await sendFileData([fileInfo], userInfo, token, setUploadProgress);
        uploadedFileIds.push(fileInfo.id);
      }

      // 과제 제출 API 호출
      const res = await submitAssignment({
        postId: assignment.id,
        fileIds: uploadedFileIds,
        description: submissionText
      });

      if (res.result) {
        setIsSubmitted(true);
        toast.success("과제가 성공적으로 제출되었습니다.");
      } else {
        toast.error("과제 제출에 실패했습니다.");
      }
    } catch (error) {
      console.error("과제 제출 실패:", error);
      toast.error("과제 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const toggleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setIsLiked(!isLiked)
  }

  // 마감일까지 남은 시간 계산
  const calculateTimeLeft = () => {
    const dueDate = new Date(assignment.dueDate)
    const now = new Date()
    const diff = dueDate - now

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}일 ${hours}시간 ${minutes}분`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
          className="z-80 lg:max-w-[800px] w-full p-0 max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxHeight: isMobileH ? "auto" : "100%" }}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">{assignment.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 과제 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={assignment.authorAvatar} />
                <AvatarFallback>{assignment.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{assignment.author}</div>
                <div className="text-sm text-gray-500">{assignment.timeAgo}</div>
              </div>
            </div>

            {/* <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{assignment.views}</span>
              </div>
            </div> */}

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>제출 기한: {new Date(assignment.dueDate).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>남은 시간: {calculateTimeLeft()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>제출 현황: {assignment.submittedCount}/{assignment.totalStudents}명</span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">과제 설명</h3>
              <p className="whitespace-pre-wrap">{assignment.description}</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t my-6"></div>

          {/* 과제 제출 폼 */}
          {!isSubmitted ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">과제 제출</h3>
              <Textarea
                placeholder="과제에 대한 설명이나 메모를 입력하세요."
                className="min-h-[120px] resize-none"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    <Paperclip className="w-4 h-4" />
                    파일 첨부
                  </Button>
                  <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                  <span className="text-sm text-gray-500">최대 5개 파일, 각 20MB 이하</span>
                </div>

                <div
                  className={`mt-4 border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging
                      ? "border-navy-500 bg-navy-50 dark:border-navy-400 dark:bg-navy-900/50"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <Paperclip className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      파일을 여기에 드래그하여 업로드하세요
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      또는 파일 첨부 버튼을 클릭하여 파일을 선택하세요
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">첨부된 파일 ({files.length})</p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-navy-600 hover:bg-navy-700 mt-4"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> 제출 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 과제 제출하기
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                과제가 성공적으로 제출되었습니다!
              </div>
              <p className="text-sm text-green-600 mt-2">제출 시간: {new Date().toLocaleString()}</p>
            </div>
          )}
        </div>
      </DialogContent>
      {/* 과제 제출 확인 모달 */}
      <AssignmentSubmitConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmSubmit}
      />
    </Dialog>
  )
}

