"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useOrganizationJoin } from "@/hooks/useOrganizationJoin"
import { useUserInfo } from "@/hooks/useUserInfo"

interface OrganizationJoinRequestModalProps {
  isOpen: boolean
  onClose: () => void
  organization: any
  onSuccess?: () => void
}

export default function OrganizationJoinRequestModal({
  isOpen,
  onClose,
  organization,
  onSuccess,
}: OrganizationJoinRequestModalProps) {
  const { requestJoin } = useOrganizationJoin()
  const { data: userInfo } = useUserInfo()
  
  const [role, setRole] = useState("STUDENT")
  const [reason, setReason] = useState("")
  const [userName, setUserName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (userInfo?.phone) {
      // 전화번호 형식 포맷팅
      setPhone(formatPhoneNumber(userInfo.phone))
    }
  }, [userInfo])

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    return numbers.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast.error("가입 사유를 입력해주세요.")
      return
    }

    if (!userName) {
      toast.error("실명을 입력해주세요.")
      return
    }

    if (!phone) {
      toast.error("전화번호를 입력해주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      await requestJoin(organization.id, {
        userId: userInfo.id,
        role,
        reason,
        userName,
        phone: phone.replace(/-/g, '')
      })

      toast.success("가입 신청이 완료되었습니다. 승인을 기다려주세요.")
      onSuccess?.()
      onClose()
      
      // 폼 초기화
      setRole("STUDENT")
      setReason("")
      setUserName("")
      setPhone("")
    } catch (error: any) {
      toast.error(error.message || "가입 신청 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{organization?.name} 가입 신청</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="realName">실명 *</Label>
            <input
              id="realName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="실명을 입력하세요"
              className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 dark:bg-navy-700 dark:border-navy-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">전화번호 *</Label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
              className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 dark:bg-navy-700 dark:border-navy-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">역할 *</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 dark:bg-navy-700 dark:border-navy-600"
            >
              <option value="STUDENT">학생</option>
              <option value="TEACHER">교사</option>
              <option value="STAFF">직원</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">가입 사유 *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="가입 사유를 입력하세요"
              className="min-h-[100px]"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="bg-navy-600 hover:bg-navy-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "제출 중..." : "가입 신청"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

