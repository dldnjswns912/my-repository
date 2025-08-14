"use client"

import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Hash, ImageIcon, X } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const categories = [
  { id: "legal", name: "법률 상담" },
  { id: "personality", name: "성격유형" },
  { id: "travel", name: "나들이 명소" },
  { id: "ott", name: "OTT워룸까" },
  { id: "finance", name: "재테크" },
  { id: "career", name: "커리어" },
  { id: "daily", name: "일상" },
  { id: "food", name: "맛집" },
]

export default function WritePage() {
  const navigate = useNavigate() // Next.js의 useRouter 대신 React Router의 useNavigate 사용
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [images, setImages] = useState([
    // 예시 이미지
    { id: 1, url: "/placeholder.svg?height=400&width=400&text=Image" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이미지 삭제 함수
  const removeImage = (imageId) => {
    setImages(images.filter((img) => img.id !== imageId))
  }

  // 글 등록 함수
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: "입력 오류",
        description: "제목, 내용, 채널은 필수 입력 항목입니다.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 실제 구현에서는 API 호출로 데이터 저장
      console.log({
        title,
        content,
        category,
        images: images.map((img) => img.url),
      })

      toast({
        title: "글 등록 완료",
        description: "게시글이 성공적으로 등록되었습니다.",
        variant: "success",
      })

      navigate("/")
    } catch (error) {
      console.error("글 등록 실패:", error)
      toast({
        title: "글 등록 실패",
        description: "글 등록에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-gray-900">
            취소
          </Link>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-navy-600 text-white hover:bg-navy-700">
            등록
          </Button>
        </div>
      </header>

      <main className="pt-14 pb-20">
        <div className="px-4 space-y-4 max-w-[800px] mx-auto">
          {/* 채널 선택 */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="채널을 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 제목 입력 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요."
            className="border-0 border-b rounded-none px-0 h-12 text-lg placeholder:text-gray-400"
          />

          {/* 내용 입력 */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요."
            className="border-0 min-h-[120px] resize-none px-0 placeholder:text-gray-400"
          />

          {/* 이미지 표시 영역 */}
          {images.map((image) => (
            <div key={image.id} className="relative">
              <div className="aspect-square bg-red-500 rounded-lg overflow-hidden">
                <img src={image.url || "/placeholder.svg"} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 하단 툴바 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="flex items-center h-16 px-4 gap-6">
          <button className="text-gray-600">
            <ImageIcon className="w-6 h-6" />
          </button>
          <button className="text-gray-600">
            <FileText className="w-6 h-6" />
          </button>
          <button className="text-gray-600">
            <Hash className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

