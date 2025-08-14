import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"

export default function AuthRequiredModal({ isOpen, onClose, action }) {
  const navigate = useNavigate()

  const handleLogin = () => {
    onClose()
    navigate("/login")
  }

  const getActionMessage = () => {
    switch (action) {
      case "comment":
        return "댓글을 작성하려면 로그인이 필요합니다."
      case "like":
        return "좋아요를 누르려면 로그인이 필요합니다."
      case "write":
        return "게시물을 작성하려면 로그인이 필요합니다."
      case "follow":
        return "팔로우하려면 로그인이 필요합니다."
      default:
        return "이 기능을 사용하려면 로그인이 필요합니다."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle>로그인이 필요합니다</DialogTitle>
          <DialogDescription>
            {getActionMessage()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleLogin}>
            로그인하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 