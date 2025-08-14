"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from "react";

export function ImageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);  // 모달 열기 함수를 전역으로 등록
  useEffect(() => {
    window.openImageModal = (imageAttachments, startIndex = 0) => {
      setImages(imageAttachments);
      setCurrentIndex(startIndex);
      setIsOpen(true);
    };

    return () => {
      window.openImageModal = undefined;
    };
  }, []);

  // 이전 이미지로 이동
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // 다음 이미지로 이동
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          setIsOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl w-full h-full p-0 bg-white border-[#E0E0E0]">
        <div className="relative flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-3 border-b border-[#E0E0E0]">
            <div className="text-sm text-gray-600">
              {currentImage?.fileName || "이미지"} ({currentIndex + 1}/{images.length})
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-[#F5F5F5]"
            >
              {/* <X size={20} /> */}
            </button>
          </div>

          {/* 이미지 표시 영역 */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#0f111a]">
            <img
              src={currentImage?.fileUrl || "/placeholder.svg"}
              alt={currentImage?.fileName || "이미지"}
              className="max-h-full max-w-full object-contain"
            />

            {/* 이전/다음 버튼 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* 썸네일 네비게이션 */}
          {images.length > 1 && (
            <div className="p-2 border-t border-[#E0E0E0] overflow-x-auto">
              <div className="flex space-x-2">
                {images.map((img, idx) => (
                  <button
                    key={img.fileId}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2",
                      currentIndex === idx
                        ? "border-[#0284c7]"
                        : "border-transparent hover:border-gray-500"
                    )}
                  >
                    <img
                      src={img.fileUrl || "/placeholder.svg"}
                      alt={img.fileName || `썸네일 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
