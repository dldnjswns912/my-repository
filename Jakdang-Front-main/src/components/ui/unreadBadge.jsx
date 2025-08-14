// 새로운 파일 - 안읽은 메시지 배지 컴포넌트
import { cn } from "@/lib/utils"

export function UnreadBadge({ count, className }) {
  if (!count || count <= 0) return null

  const displayCount = count > 99 ? "99+" : count

  return (
    <div
      className={cn(
        "bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
        className,
      )}
    >
      {displayCount}
    </div>
  )
}
