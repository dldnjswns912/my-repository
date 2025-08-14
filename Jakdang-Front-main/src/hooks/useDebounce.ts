"use client"

import { useState, useEffect } from "react"

/**
 * 입력값에 디바운스를 적용하는 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간 (밀리초)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 지정된 지연 시간 후에 값을 업데이트
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 타이머 정리 (컴포넌트 언마운트 또는 값/지연 변경 시)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
