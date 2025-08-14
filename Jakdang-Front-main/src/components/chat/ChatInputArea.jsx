"use client"

import { Button } from "@/components/ui/button"
import { ChatInput } from "@/components/ui/chat-input"
import { newMessageAtom } from "@/jotai/chatAtoms"
import { useAtom } from "jotai"
import { Image, Paperclip, Send, Smile } from "lucide-react"
import { useCallback, useRef, useState } from "react"

const ChatInputArea = ({ onSendMessage, onFileUpload, isUploading, connectionState, messageListRef }) => {
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const [newMessage, setNewMessage] = useAtom(newMessageAtom)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault()
      if (!newMessage.trim() || isUploading || connectionState !== "connected") return

      // 메시지 전송 이후에 스크롤 하도록 messageListRef 활용
      if (messageListRef && messageListRef.current) {
        messageListRef.current.scrollToBottom()
      }

      onSendMessage(e)

      // 입력 필드 높이 초기화
      const textareaElement = e.target.querySelector("textarea")
      if (textareaElement) {
        textareaElement.style.height = "auto"
      }
    },
    [newMessage, isUploading, connectionState, onSendMessage, messageListRef],
  )

  // 파일 업로드 핸들러
  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        // 파일 업로드 후 스크롤 조정
        if (messageListRef && messageListRef.current) {
          messageListRef.current.scrollToBottom()
        }
        onFileUpload(e.target.files)
      }
    },
    [onFileUpload, messageListRef],
  )

  // 이모지 선택 핸들러
  const handleEmojiSelect = useCallback(
    (emoji) => {
      setNewMessage((prev) => prev + emoji)
      setShowEmojiPicker(false)
    },
    [setNewMessage],
  )

  return (
    <form
      onSubmit={handleSendMessage}
      className="p-4 bg-white dark:bg-navy-800 border-t dark:border-navy-700 flex items-center gap-2"
    >
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || connectionState !== "connected"}
        className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
      >
        <Paperclip className="h-5 w-5 text-chat-primary dark:text-white" />
      </Button>

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} multiple />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => imageInputRef.current?.click()}
        disabled={isUploading || connectionState !== "connected"}
        className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
      >
        <Image className="h-5 w-5 text-chat-primary dark:text-white" />
      </Button>

      <ChatInput
        placeholder="메시지 입력..."
        className="flex-1 bg-gray-100 dark:bg-navy-700 border-none rounded-full"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e)
          }
        }}
        disabled={isUploading || connectionState !== "connected"}
      />

      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isUploading || connectionState !== "connected"}
          className="rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover"
        >
          <Smile className="h-5 w-5 text-chat-primary dark:text-white" />
        </Button>

        {showEmojiPicker && (
          <div className="absolute bottom-12 right-0 bg-white dark:bg-navy-700 p-2 rounded-xl shadow-modal border dark:border-navy-600 z-10 w-64">
            <div className="grid grid-cols-8 gap-1">
              {["😀", "😂", "😊", "😍", "🥰", "😎", "😢", "😭", "👍", "👎", "👏", "🙏", "🎉", "❤️", "🔥", "✨"].map(
                (emoji) => (
                  <button
                    key={emoji}
                    className="text-xl p-1 hover:bg-gray-100 dark:hover:bg-navy-600 rounded"
                    onClick={() => handleEmojiSelect(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={!newMessage.trim() || isUploading || connectionState !== "connected"}
        className={`rounded-full hover:bg-chat-hover dark:hover:bg-chat-darkHover ${!newMessage.trim() || isUploading || connectionState !== "connected" ? "text-gray-400" : "text-chat-primary dark:text-chat-accent"}`}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  )
}

export default ChatInputArea