import { useState } from "react"
import { Loader2 } from 'lucide-react'

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/placeholder.svg?height=300&width=600",
  // Next.js Image 컴포넌트 및 SVG 관련 속성들 필터링
  priority,
  placeholder,
  blurDataURL,
  quality,
  loading,
  unoptimized,
  fill,
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        {...props}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setError(true)
        }}
      />
    </div>
  )
}