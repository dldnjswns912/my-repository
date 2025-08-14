import { useState, useEffect } from "react"

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // 초기 상태 설정
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // 리스너 설정
    const listener = () => {
      setMatches(media.matches)
    }

    // 미디어 쿼리 변경 감지
    media.addEventListener("change", listener)

    // 클린업
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])

  return matches
}

