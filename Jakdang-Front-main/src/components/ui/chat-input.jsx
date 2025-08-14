import { cn } from "@/lib/utils"
import * as React from "react"

const ChatInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[40px] max-h-[120px] overflow-y-auto",
        className,
      )}
      rows={1}
      onInput={(e) => {
        // 자동 높이 조절
        e.target.style.height = "auto"
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
      }}
      {...props}
    />
  )
})
ChatInput.displayName = "ChatInput"

export { ChatInput }

