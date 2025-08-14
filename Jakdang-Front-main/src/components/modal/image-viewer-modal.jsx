import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ImageViewerModal({ isOpen, onClose, imageSrc, alt = "이미지" }) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setScale(1)
      setRotation(0)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3)) // 최대 3배까지 확대
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5)) // 최소 0.5배까지 축소
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full mb:max-w-[90vw] mb:max-h-[90vh] p-0 bg-black/90 border-none overflow-hidden z-[100]">
        <div className="relative w-full h-full flex flex-col">
          {/* 상단 컨트롤 바 */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20">
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20">
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRotate} className="text-white hover:bg-white/20">
                <RotateCw className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* 이미지 컨테이너 */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div
              className="relative transition-all duration-200 ease-in-out"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc || "/placeholder.svg"}
                  alt={alt}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
                  이미지를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

