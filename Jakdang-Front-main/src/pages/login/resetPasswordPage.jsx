import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useEmailVerificationApi } from "@/service/api/emailVerificationApi"
import LogoImage from '@/assets/images/logo.png'
import logo from '@/assets/logo.svg'

/**
 * 비밀번호 재설정 페이지
 */
export default function ResetPasswordPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyCode, resetPassword } = useEmailVerificationApi()
  
  // URL 파라미터에서 이메일과 코드 추출
  const searchParams = new URLSearchParams(location.search)
  const email = searchParams.get('email')
  const code = searchParams.get('code')
  
  const [verificationStatus, setVerificationStatus] = useState('pending') // pending, success, failed
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 비밀번호 복잡도 검사
  const passwordCriteria = {
    length: newPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[@$!%*#?&]/.test(newPassword)
  }
  
  // 비밀번호 강도 계산 (0-100)
  const calculatePasswordStrength = () => {
    const criteriaCount = Object.values(passwordCriteria).filter(Boolean).length
    return criteriaCount * 25
  }
  
  // 비밀번호 강도에 따른 색상
  const getStrengthColor = () => {
    const strength = calculatePasswordStrength()
    if (strength <= 25) return 'bg-red-500'
    if (strength <= 50) return 'bg-orange-500'
    if (strength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  // 비밀번호 유효성 검사
  const isPasswordValid = (password) => {
    // 최소 8자, 영문자, 숫자, 특수문자 포함
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
    return passwordRegex.test(password)
  }
  
  // 비밀번호 일치 여부 검사
  const isPasswordMatch = () => {
    return newPassword === confirmPassword && newPassword !== ''
  }
  
  // 폼 유효성 검사
  const isFormValid = () => {
    return isPasswordValid(newPassword) && isPasswordMatch() && verificationStatus === 'success'
  }

  // 컴포넌트 마운트 시 인증 코드 검증
  useEffect(() => {
    const validateCode = async () => {
      if (!email || !code) {
        setVerificationStatus('failed')
        toast({
          title: '오류',
          description: '유효하지 않은 접근입니다. 비밀번호 찾기 페이지로 이동합니다.',
          variant: 'destructive'
        })
        navigate('/login/forgot-password')
        return
      }
      
      const { result, response } = await verifyCode(email, code)
      if (result && response.success) {
        setVerificationStatus('success')
        toast({
          title: '인증 성공',
          description: '이메일 인증이 완료되었습니다. 새로운 비밀번호를 설정해주세요.'
        })
      } else {
        setVerificationStatus('failed')
        toast({
          title: '인증 실패',
          description: response.message || '인증 코드가 유효하지 않습니다. 다시 시도해주세요.',
          variant: 'destructive'
        })
        navigate('/login/forgot-password')
      }
    }
    
    validateCode()
  }, [email, code, navigate, toast, verifyCode])
  
  // 비밀번호 재설정 처리
  const handleResetPassword = async () => {
    if (!isFormValid()) return
    
    setIsSubmitting(true)
    
    const { result, response } = await resetPassword(email, code, newPassword)
    
    if (result && response.success) {
      toast({
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.'
      })
      navigate('/login')
    } else {
      toast({
        title: '비밀번호 변경 실패',
        description: response.message || '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive'
      })
    }
    
    setIsSubmitting(false)
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Link to="/">
            <img src={logo} alt="로고" className="h-12 mb-2" />
          </Link>
          <h1 className="text-2xl font-bold text-center">비밀번호 재설정</h1>
        </div>
        
        {verificationStatus === 'success' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium">
                새 비밀번호
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* 비밀번호 강도 표시기 */}
              {newPassword && (
                <>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full ${getStrengthColor()}`} 
                      style={{ width: `${calculatePasswordStrength()}%` }}
                    ></div>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li className="flex items-center space-x-2">
                      {passwordCriteria.length ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                      <span>8자 이상</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      {passwordCriteria.hasLetter ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                      <span>영문자 포함</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      {passwordCriteria.hasNumber ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                      <span>숫자 포함</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      {passwordCriteria.hasSpecial ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                      <span>특수문자 포함 (@$!%*#?&)</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                비밀번호 확인
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && !isPasswordMatch() && (
                <p className="text-xs text-red-500 mt-1">
                  비밀번호가 일치하지 않습니다.
                </p>
              )}
              {confirmPassword && isPasswordMatch() && (
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <Check size={14} className="mr-1" /> 비밀번호가 일치합니다.
                </p>
              )}
            </div>
            
            <Button
              type="button"
              className="w-full"
              onClick={handleResetPassword}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '비밀번호 변경'}
            </Button>
          </div>
        ) : verificationStatus === 'failed' ? (
          <div className="space-y-4 text-center">
            <p className="text-red-500">인증 코드가 유효하지 않습니다.</p>
            <Button 
              type="button" 
              className="w-full"
              onClick={() => navigate('/login/forgot-password')}
            >
              비밀번호 찾기로 돌아가기
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
} 