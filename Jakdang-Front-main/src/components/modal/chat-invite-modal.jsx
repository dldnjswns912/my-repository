"use client"

import { useState } from "react"
import { Check, Copy, Mail, Users, UserSearch } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function InviteModal({ roomId, roomName }) {
  const [emails, setEmails] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 초대 링크 생성 (실제 구현에서는 서버에서 생성된 고유 링크를 사용해야 합니다)
  const inviteLink = `${window.location.origin}/join-chat/${roomId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)

    toast({
      title: "링크가 복사되었습니다",
      description: "초대 링크를 공유할 수 있습니다.",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleInviteByEmail = async () => {
    if (!emails.trim()) return

    setIsLoading(true)

    try {
      // 여기에 실제 이메일 초대 API 호출 코드를 작성합니다
      // 예: await inviteUsersByEmail(roomId, emails.split(',').map(email => email.trim()))

      // 임시 지연 (실제 구현에서는 제거)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "초대 메일이 발송되었습니다",
        description: "사용자들에게 초대 메일이 전송되었습니다.",
      })

      setEmails("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "초대 실패",
        description: "초대 메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserSearch size={16} />
          <span>초대하기</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>채팅방에 초대하기</DialogTitle>
          <DialogDescription>'{roomName}'에 다른 사용자를 초대하세요.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">링크로 초대</TabsTrigger>
            <TabsTrigger value="email">이메일로 초대</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="invite-link">초대 링크</Label>
              <div className="flex items-center space-x-2">
                <Input id="invite-link" value={inviteLink} readOnly className="flex-1" />
                <Button size="icon" onClick={handleCopyLink} variant="outline">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">이 링크를 공유하여 다른 사용자를 초대할 수 있습니다.</p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="emails">이메일 주소</Label>
              <Textarea
                id="emails"
                placeholder="초대할 이메일 주소를 입력하세요. 여러 명을 초대하려면 쉼표로 구분하세요."
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">초대 메일에는 채팅방 참여 링크가 포함됩니다.</p>
            </div>

            <Button onClick={handleInviteByEmail} className="w-full gap-2" disabled={!emails.trim() || isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Mail size={16} />
              )}
              <span>이메일로 초대하기</span>
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <DialogTrigger asChild>
            <Button variant="outline">닫기</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
