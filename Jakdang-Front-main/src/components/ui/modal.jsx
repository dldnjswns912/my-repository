"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Modal({ isOpen, onClose, children, className }) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey)
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div
        className={cn(
          "relative bg-white dark:bg-navy-800 rounded-lg shadow-lg max-h-[90vh] overflow-hidden w-full max-w-md",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ className, children, ...props }) {
  return (
    <div className={cn("relative px-6 py-4 border-b dark:border-navy-700", className)} {...props}>
      <div className="text-center">{children}</div>
    </div>
  )
}

export function ModalTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold inline-block", className)} {...props} />
}

export function ModalDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground mt-1", className)} {...props} />
}

export function ModalBody({ className, ...props }) {
  return <div className={cn("p-6 overflow-y-auto", className)} {...props} />
}

export function ModalFooter({ className, ...props }) {
  return <div className={cn("px-6 py-4 border-t dark:border-navy-700 flex justify-end gap-3", className)} {...props} />
}

