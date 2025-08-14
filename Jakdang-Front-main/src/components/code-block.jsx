import { useState, useEffect, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain Text" },
]

export default function CodeBlock({ 
  code = "", 
  language = "plaintext", 
  editable = false, 
  onChange, 
  onCodeChange 
}) {
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(editable)
  const [codeValue, setCodeValue] = useState(code)
  const textareaRef = useRef(null)
  const previewRef = useRef(null)
  
  // 코드값이 외부에서 변경되었을 때 동기화
  useEffect(() => {
    setCodeValue(code)
  }, [code])

  // 하이라이트 처리
  useEffect(() => {
    if (codeValue) {
      try {
        const processedCode = codeValue.replace(/\\n/g, "\n")

        if (selectedLanguage === "plaintext") {
          setHighlightedCode(processedCode)
        } else {
          const highlighted = hljs.highlight(processedCode, { language: selectedLanguage }).value
          setHighlightedCode(highlighted)
        }
      } catch (error) {
        console.error("Highlighting error:", error)
        setHighlightedCode(codeValue)
      }
    } else {
      setHighlightedCode("")
    }
  }, [codeValue, selectedLanguage])

  // 언어 변경 처리
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
    setIsDropdownOpen(false)
    if (onChange) {
      onChange(lang)
    }
  }

  // 코드 변경 처리
  const handleCodeChange = (e) => {
    const newCode = e.target.value
    setCodeValue(newCode)
    if (onCodeChange) {
      onCodeChange(newCode)
    }
  }

  // 편집 모드와 미리보기 모드 전환
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // 클립보드에 복사
  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeValue).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      (err) => {
        console.error("Could not copy text: ", err)
      }
    )
  }

  // 언어 레이블 가져오기
  const getLanguageLabel = () => {
    const lang = LANGUAGES.find((l) => l.value === selectedLanguage)
    return lang ? lang.label : "Select Language"
  }

  // 탭 키 처리
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      
      // 탭 공백 추가 (2칸)
      const newCode = 
        codeValue.substring(0, start) + "  " + codeValue.substring(end)
      
      setCodeValue(newCode)
      if (onCodeChange) {
        onCodeChange(newCode)
      }
      
      // 커서 위치 설정
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }
  }

  // 동일한 스크롤 위치 유지
  const syncScroll = (e) => {
    if (previewRef.current) {
      previewRef.current.scrollTop = e.target.scrollTop
      previewRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#0d1117] relative">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-medium text-gray-200 hover:text-white hover:bg-[#1f242c]"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {getLanguageLabel()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div
                className="absolute z-50 w-56 rounded-md bg-[#1f242c] shadow-lg border border-gray-700 max-h-60 overflow-auto"
                style={{ top: "2.5rem", left: "1rem" }}
              >
                <div className="py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-sm text-gray-200 hover:bg-[#2d333b]",
                        selectedLanguage === lang.value && "bg-[#2d333b]"
                      )}
                      onClick={() => handleLanguageChange(lang.value)}
                    >
                      {lang.label}
                      {selectedLanguage === lang.value && <Check className="ml-auto h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm text-gray-200 hover:text-white hover:bg-[#1f242c]"
            onClick={toggleEditMode}
          >
            {isEditing ? "미리보기" : "편집"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm text-gray-200 hover:text-white hover:bg-[#1f242c]"
            onClick={copyToClipboard}
          >
            {copied ? "복사됨!" : "복사"}
          </Button>
        </div>
      </div>

      <div className="relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={codeValue}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className="w-full p-4 font-mono text-sm text-gray-200 bg-[#0d1117] outline-none resize-none min-h-[200px] overflow-auto whitespace-pre"
            style={{ 
              tabSize: 2, 
              lineHeight: 1.5, 
              height: "auto",
              minHeight: "200px"
            }}
            placeholder="코드를 입력하세요..."
          />
        ) : (
          <div 
            ref={previewRef}
            className="p-4 overflow-x-auto"
          >
            {selectedLanguage === "plaintext" ? (
              <pre className="text-sm font-mono text-gray-200 whitespace-pre">
                {codeValue.replace(/\\n/g, "\n")}
              </pre>
            ) : (
              <pre className="text-sm font-mono">
                <code 
                  dangerouslySetInnerHTML={{ __html: highlightedCode }} 
                  className="hljs text-gray-200 whitespace-pre" 
                />
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}