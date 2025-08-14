"use client"

import { Button } from "@/components/ui/button"
import React from "react"

// 메모이제이션된 연결 상태 컴포넌트
const ConnectionStatus = React.memo(({ connectionState, reconnect }) => {
  if (connectionState === "connecting") {
    return (
      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-center border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-center">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">채팅 서버에 연결 중...</p>
        </div>
      </div>
    )
  }

  if (connectionState === "error") {
    return (
      <div className="p-2 bg-red-50 dark:bg-red-900/30 text-center border-b border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-400 text-sm">채팅 서버 연결에 문제가 있습니다.</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-1 text-red-600 border-red-300 hover:bg-red-50 rounded-full text-xs px-3 py-1"
          onClick={reconnect}
        >
          다시 연결
        </Button>
      </div>
    )
  }

  return null
})

ConnectionStatus.displayName = "ConnectionStatus"

export default ConnectionStatus

