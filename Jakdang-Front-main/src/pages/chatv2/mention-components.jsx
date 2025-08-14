"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAtom } from "jotai"
import { userInfoAtom } from "@/jotai/authAtoms"

// 멘션 컴포넌트
export function MentionComponent({ message, setMessage, inputRef, roomMembers = [], isDisabled = false }) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 })
  const [filteredMembers, setFilteredMembers] = useState([])
  const [user] = useAtom(userInfoAtom)
  const popoverRef = useRef(null)

  console.log("멘션 컴포넌트 렌더링", { message, roomMembers, isDisabled })

  // 멘션 감지 및 처리
  useEffect(() => {
    if (isDisabled) return

    // '@' 문자 감지
    const detectMention = () => {
      if (!message || !inputRef.current) return

      const cursorPosition = inputRef.current.selectionStart
      const textBeforeCursor = message.substring(0, cursorPosition)

      // '@' 문자 이후 단어 찾기
      const mentionMatch = textBeforeCursor.match(/@(\S*)$/)

      if (mentionMatch) {
        const mentionStart = mentionMatch.index
        const mentionText = mentionMatch[1]

        setSearchTerm(mentionText)
        setMentionPosition({
          start: mentionStart,
          end: mentionStart + mentionText.length + 1,
        })

        // 멤버 필터링
        const filtered = roomMembers.filter(
          (member) => member.nickname.toLowerCase().includes(mentionText.toLowerCase()) && member.id !== user?.userId,
        )

        setFilteredMembers(filtered)
        setOpen(true)
      } else {
        setOpen(false)
      }
    }

    detectMention()
  }, [message, inputRef, roomMembers, user?.userId, isDisabled])

  // 멘션 선택 처리
  const handleSelectMention = (member) => {
    if (!inputRef.current) return

    const beforeMention = message.substring(0, mentionPosition.start)
    const afterMention = message.substring(mentionPosition.end)

    // 멘션 텍스트 삽입 (@사용자명)
    const newMessage = `${beforeMention}@${member.nickname} ${afterMention}`
    setMessage(newMessage)

    // 커서 위치 조정
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = mentionPosition.start + member.nickname.length + 2 // @ + 이름 + 공백
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)

    setOpen(false)
  }

  // 멘션 목록 위치 계산
  const calculatePopoverPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 }

    const inputRect = inputRef.current.getBoundingClientRect()
    const cursorPosition = inputRef.current.selectionStart

    // 커서 위치에 따른 좌표 계산 (간단한 추정)
    const charWidth = 8 // 평균 문자 너비 (픽셀)
    const textBeforeCursor = message.substring(0, cursorPosition)
    const lines = textBeforeCursor.split("\n")
    const currentLine = lines[lines.length - 1]

    const left = Math.min(currentLine.length * charWidth, inputRect.width - 200)

    return {
      top: -120, // 입력창 위에 표시
      left: left,
    }
  }

  const popoverPosition = calculatePopoverPosition()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-0 w-0 overflow-hidden" />
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="w-[200px] p-0 bg-white border border-[#E0E0E0] shadow-md"
        style={{
          position: "absolute",
          transform: "translateY(-100%)",
          marginLeft: `${popoverPosition.left}px`,
          marginTop: `${popoverPosition.top}px`,
        }}
      >
        <Command>
          <CommandInput placeholder="사용자 검색..." value={searchTerm} onValueChange={setSearchTerm} className="h-9" />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  onSelect={() => handleSelectMention(member)}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[#F5F5F5]"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.photoURL} />
                    <AvatarFallback className="bg-[#0284c7] text-white text-xs">
                      {member.nickname.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.nickname}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
