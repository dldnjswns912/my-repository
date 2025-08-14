import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogContent2} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function AssignmentSubmitConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent2 className="z-90 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">과제 제출 확인</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          <div className="bg-yellow-50 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-center">
            과제를 제출하시겠습니까?
            <br />
            <span className="text-sm text-gray-500">제출 후에는 수정이 불가능합니다.</span>
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="sm:flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="sm:flex-1 bg-navy-600 hover:bg-navy-700" onClick={onConfirm}>
            제출하기
          </Button>
        </DialogFooter>
      </DialogContent2>
    </Dialog>
  )
}

