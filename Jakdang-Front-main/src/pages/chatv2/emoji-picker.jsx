"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Smile, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from "react"

// 이모지 카테고리 정의
const emojiCategories = [
  { id: "recent", name: "최근", emojis: [] },
  {
    id: "smileys",
    name: "표정",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", 
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", 
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", 
      "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"
    ],
  },
  {
    id: "people",
    name: "사람",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", 
      "🤙", "👈", "👉", "👆", "🖕", "👇", "👍", "👎", "✊", "👊", "🤛", "🤜", 
      "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾", "🦿", "🦵", "🦶", "👂", 
      "🦻", "👃", "🧠", "👣", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"
    ],
  },
  {
    id: "nature",
    name: "자연",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", 
      "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", 
      "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", 
      "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️"
    ],
  },
  {
    id: "food",
    name: "음식",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", 
      "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", 
      "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", 
      "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴"
    ],
  },
  {
    id: "activities",
    name: "활동",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", 
      "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", 
      "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", 
      "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽"
    ],
  },
  {
    id: "travel",
    name: "여행",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", 
      "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", 
      "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", 
      "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️"
    ],
  },
  {
    id: "objects",
    name: "물건",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", 
      "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", 
      "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", 
      "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸"
    ],
  },
  {
    id: "symbols",
    name: "기호",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", 
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", 
      "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", 
      "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳"
    ],
  },
  {
    id: "flags",
    name: "국기",
    emojis: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇨", "🇦🇩", "🇦🇪", 
      "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", 
      "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", 
      "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸"
    ],
  },
]

export function EmojiPicker({ onEmojiSelect, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("smileys")
  const [recentEmojis, setRecentEmojis] = useState([])
  const pickerRef = useRef(null)

  // 로컬 스토리지에서 최근 사용한 이모지 로드
  useEffect(() => {
    try {
      const storedEmojis = localStorage.getItem("recentEmojis")
      if (storedEmojis) {
        setRecentEmojis(JSON.parse(storedEmojis))
        
        // 최근 이모지 카테고리 업데이트
        const recentCategory = emojiCategories.find(cat => cat.id === "recent")
        if (recentCategory) {
          recentCategory.emojis = JSON.parse(storedEmojis)
        }
      }
    } catch (error) {
      console.error("최근 이모지 로드 오류:", error)
    }
  }, [])

  // 외부 클릭 감지 핸들러
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 이모지 선택 처리
  const handleEmojiSelect = useCallback((emoji) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji)
    }

    // 최근 사용한 이모지 업데이트
    const updatedRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20)
    setRecentEmojis(updatedRecent)
    
    // 최근 이모지 카테고리 업데이트
    const recentCategory = emojiCategories.find(cat => cat.id === "recent")
    if (recentCategory) {
      recentCategory.emojis = updatedRecent
    }
    
    try {
      localStorage.setItem("recentEmojis", JSON.stringify(updatedRecent))
    } catch (error) {
      console.error("최근 이모지 저장 오류:", error)
    }
  }, [onEmojiSelect, recentEmojis])

  // 이모지 창 토글
  const toggleEmojiPicker = () => {
    setIsOpen(prev => !prev)
  }

  return (
    <div className="relative h-[20px]">
      <button 
        className={cn(
          "text-gray-400 hover:text-[#0284c7] transition-colors",
          disabled && "text-gray-600 cursor-not-allowed"
        )}
        disabled={disabled}
        onClick={toggleEmojiPicker}
      >
        <Smile size={20} />
      </button>
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute bottom-10 right-0 w-[340px] bg-white border border-[#E0E0E0] rounded-lg shadow-lg z-50"
          onClick={(e) => e.stopPropagation()} // 이벤트 버블링 방지
        >
          <div className="flex items-center justify-between border-b border-[#E0E0E0] p-3">
            <h4 className="text-sm font-medium text-gray-200">이모티콘</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-[#F5F5F5]"
              onClick={() => setIsOpen(false)}
            >
              <X size={14} className="text-gray-400" />
            </Button>
          </div>
          
          <div className="flex overflow-x-auto bg-white border-b border-[#E0E0E0] p-2 h-14 w-full">
            {emojiCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 text-xs rounded-md mx-1",
                  activeTab === category.id
                    ? "bg-[#0284c7] text-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-[#F5F5F5]"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="h-[260px] overflow-y-auto bg-[#222533] p-3">
            {emojiCategories.map((category) => (
              <div 
                key={category.id} 
                className={cn("h-full", activeTab !== category.id && "hidden")}
              >
                <div className="grid grid-cols-7 gap-2">
                  {category.emojis.length > 0 ? (
                    category.emojis.map((emoji, index) => (
                      <button
                        key={`${category.id}-${index}`}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#F5F5F5] rounded-md cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleEmojiSelect(emoji)
                        }}
                      >
                        {emoji}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-7 h-full flex items-center justify-center text-gray-400 text-sm p-4">
                      {category.id === "recent" ? "최근 사용한 이모티콘이 없습니다" : "이모티콘을 불러오는 중..."}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
