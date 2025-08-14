import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useEmailVerificationApi } from "@/service/api/emailVerificationApi"
import logo from "@/assets/logo.svg"

/**
 * 비밀번호 찾기 페이지
 */
export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { sendPasswordResetRequest } = useEmailVerificationApi()
  
  const [email, setEmail] = useState("")
  const [isEmailTouched, setIsEmailTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 이메일 유효성 검사
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  // 폼 유효성 검사
  const isFormValid = () => {
    return isEmailValid(email)
  }
  
  // 이메일 변경 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (!isEmailTouched) setIsEmailTouched(true)
  }
  
  // 비밀번호 재설정 이메일 발송
  const handleSendResetEmail = async (e) => {
    e.preventDefault()
    
    if (!isEmailValid(email)) {
      toast({
        title: "유효하지 않은 이메일",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const { result, response } = await sendPasswordResetRequest(email)
      
      if (result && response.success) {
        toast({
          title: "이메일 발송 완료",
          description: "비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요."
        })
        
        // 성공 페이지로 이동하면서 이메일 정보 전달
        navigate("/login/reset-email-sent", { state: { email } })
      } else {
        toast({
          title: "이메일 발송 실패",
          description: response.message || "비밀번호 재설정 이메일 발송에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "서버와 통신 중 오류가 발생했습니다. 나중에 다시 시도해주세요.",
        variant: "destructive"
      })
      console.error('Password reset request error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Link to="/">
            <img src={logo} alt="로고" className="h-12 mb-2" />
          </Link>
          <h1 className="text-2xl font-bold text-center">비밀번호 찾기</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>
        
        <form onSubmit={handleSendResetEmail} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              placeholder="가입한 이메일 주소를 입력하세요"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setIsEmailTouched(true)}
              className={`${
                isEmailTouched && !isEmailValid(email) ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
            />
            {isEmailTouched && !isEmailValid(email) && (
              <p className="text-xs text-red-500">유효한 이메일 주소를 입력해주세요.</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "비밀번호 재설정 이메일 받기"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
} 