import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { useToast } from '@/components/ui/use-toast'
import { useEmailVerificationApi } from '@/service/api/emailVerificationApi'

export default function ResetEmailSentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { sendPasswordResetRequest } = useEmailVerificationApi()
  const email = location.state?.email || ''
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  useEffect(() => {
    // 이메일 정보가 없으면 비밀번호 찾기 페이지로 리다이렉트
    if (!email) {
      navigate('/login/forgot-password')
    }
  }, [email, navigate])
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])
  
  if (!email) return null
  
  // 이메일 주소 마스킹 처리 (예: ab***@example.com)
  const maskEmail = (email) => {
    const [username, domain] = email.split('@')
    let maskedUsername = ''
    
    if (username.length <= 2) {
      maskedUsername = username[0] + '*'
    } else {
      maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2)
    }
    
    return `${maskedUsername}@${domain}`
  }

  // 비밀번호 재설정 이메일 재전송
  const handleResendEmail = async () => {
    if (countdown > 0) return
    
    setIsResending(true)
    
    try {
      const { result, response } = await sendPasswordResetRequest(email)
      
      if (result && response.success) {
        toast({
          title: "이메일 재전송 완료",
          description: `${maskEmail(email)}로 비밀번호 재설정 메일을 다시 전송했습니다.`,
        })
        // 재전송 후 60초 카운트다운 시작
        setCountdown(60)
      } else {
        toast({
          title: "이메일 전송 실패",
          description: response.message || "비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요.",
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
      setIsResending(false)
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Link to="/">
            <img src={logo} alt="로고" className="h-12 mb-2" />
          </Link>
          
          <div className="my-6 flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-center">이메일 발송 완료</h1>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              <span className="font-medium">{maskEmail(email)}</span> 주소로 비밀번호 재설정 링크를 발송했습니다.
            </p>
            <p className="text-sm text-gray-500">
              이메일을 확인하여 비밀번호 재설정을 완료해주세요.
              메일이 도착하지 않았다면 스팸함을 확인해주세요.
            </p>
          </div>
        </div>
        
        <div className="space-y-4 pt-4">
          <Button
            type="button"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
          >
            {isResending 
              ? "처리 중..." 
              : countdown > 0 
                ? `재전송 대기 중 (${countdown}초)` 
                : "이메일 다시 보내기"}
          </Button>
          
          <div className="text-center">
            <Link to="/login" className="text-primary hover:underline text-sm">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 