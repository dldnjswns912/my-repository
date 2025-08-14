import SocialLoginButton from "@/components/sign/socialLoginButton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAxios } from "@/hooks/useAxios"
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import TermsModal from "@/components/modal/terms-modal"
import { useToast } from "@/components/toast-provider"
import EmailVerification from "@/components/sign/EmailVerification"
import { useLogin } from "@/hooks/useLogin"

export default function SignupPage() {
  const { mutate: loginMutate } = useLogin();
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsModalType, setTermsModalType] = useState("terms") // "terms" or "privacy"
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState(null)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false)
  const [nicknameMessage, setNicknameMessage] = useState("")
  const emailVerificationRef = useRef(null);
  const { toast } = useToast()

  const axios = useAxios();

  // 이메일 유효성 검사
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 전화번호 유효성 검사
  const isPhoneValid = (phone) => {
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    return numbers.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }

  // 비밀번호 유효성 검사
  const isPasswordValid = () => {
    const minLength = password.length >= 8
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return minLength && hasNumber && hasSpecial
  }

  // 비밀번호 일치 여부 확인
  const doPasswordsMatch = () => {
    return password === confirmPassword && confirmPassword !== ""
  }

  // 이메일 인증 완료 처리
  const handleVerificationComplete = (verified) => {
    setIsEmailVerified(verified)
    if (verified) {
      toast({
        title: "인증 완료",
        description: "이메일 인증이 완료되었습니다.",
        variant: "default",
      })
    }
  }

  // 이메일 인증 오류 처리
  const handleVerificationError = (error) => {
    setVerificationError(error)
    toast({
      title: "인증 오류",
      description: error,
      variant: "destructive",
    })
  }

  // 닉네임 중복 검사 함수
  const checkNickname = async () => {
    if (!nickname || nickname.trim() === '') {
      setNicknameMessage("닉네임을 입력해주세요.")
      setIsNicknameAvailable(false)
      return
    }

    setIsCheckingNickname(true)
    setNicknameMessage("")

    try {
      const res = await axios.fetchPost('auth/check-nickname', {
        nickname: nickname
      })

      if (res.result) {
        if (res.response.resultCode === 200) {
          setIsNicknameAvailable(true)
          setNicknameMessage(res.response.resultMessage || "사용 가능한 닉네임입니다.")
        } else {
          setIsNicknameAvailable(false)
          setNicknameMessage(res.response.resultMessage || "이미 사용 중인 닉네임입니다.")
        }
      } else {
        setIsNicknameAvailable(false)
        setNicknameMessage("닉네임 확인 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("닉네임 확인 실패:", error)
      setIsNicknameAvailable(false)
      setNicknameMessage("닉네임 확인에 실패했습니다.")
    } finally {
      setIsCheckingNickname(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword || !nickname || !phone) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!isEmailValid(email)) {
      toast({
        title: "이메일 오류",
        description: "올바른 이메일 형식이 아닙니다.",
        variant: "destructive",
      })
      return
    }

    if (!isEmailVerified) {
      toast({
        title: "인증 필요",
        description: "이메일 인증을 완료해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!isNicknameAvailable) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!isPhoneValid(phone)) {
      toast({
        title: "전화번호 오류",
        description: "올바른 전화번호 형식이 아닙니다.",
        variant: "destructive",
      })
      return
    }

    if (!isPasswordValid()) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 8자 이상이며, 숫자와 특수문자를 포함해야 합니다.",
        variant: "destructive",
      })
      return
    }

    if (!doPasswordsMatch()) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    if (!agreeTerms || !agreePrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "필수 약관에 동의해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("회원가입 시도:", { email, password, nickname, phone, agreeMarketing })

      const res = await axios.fetchPost('/auth/signUp', {
        email,
        password,
        // name: name,
        nickname: nickname,
        phone: phone.replace(/-/g, '')
      });

      if (res.result) {
        if (res.response.resultCode === 200) {
          toast({
            title: "회원가입 성공",
            description: "회원가입이 완료되었습니다.",
            variant: "default",
          })
          // 회원가입 성공 시 자동 로그인
          loginMutate({ username: email, password });
          return;
        }
        else if (res.response.resultCode === 400) {
          console.error("회원가입 실패:", ` (${res.response.resultCode}) ${res.response.resultMessage}`);
          toast({
            title: "회원가입 실패",
            description: res.response.resultMessage,
            variant: "destructive",
          })
          return;
        }
        else {
          console.error("회원가입 실패:", ` (${res.response.resultCode}) ${res.response.resultMessage}`);
          toast({
            title: "회원가입 실패",
            description: "회원가입에 실패했습니다. 다시 시도해주세요.",
            variant: "destructive",
          })
          return;
        }
      }
      else {
        console.error("회원가입 실패:", res.response);
        toast({
          title: "회원가입 실패",
          description: "회원가입에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive",
        })
        return;
      }


    } catch (error) {
      console.error("회원가입 실패:", error)
      toast({
        title: "회원가입 실패",
        description: "회원가입에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">회원가입</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 md:p-8">
          {/* 로고 */}
          <div className="flex justify-center mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-rPNOL4x5R207uiAJwotp3sB3Bsc2wj.png"
              alt="JAKDANG LABS"
              width={150}
              height={40}
              className="object-contain"
            />
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailVerified}
                    required
                  />
                  {isEmailVerified ? (
                    <div className="bg-green-100 rounded-md px-2 py-1 flex items-center whitespace-nowrap">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">인증 완료</span>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={() => {
                        if (emailVerificationRef.current) {
                          emailVerificationRef.current.sendVerificationCode();
                        }
                      }} 
                      disabled={!isEmailValid(email) || isEmailVerified} 
                      className="whitespace-nowrap"
                    >
                      인증코드 발송
                    </Button>
                  )}
                </div>
                {email && !isEmailValid(email) && (
                  <p className="text-red-500 text-xs">올바른 이메일 형식이 아닙니다.</p>
                )}
                {isEmailValid(email) && !isEmailVerified && (
                  <EmailVerification 
                    ref={emailVerificationRef}
                    email={email} 
                    onVerificationComplete={handleVerificationComplete}
                    onError={handleVerificationError}
                    noButton={true}
                  />
                )}
              </div>

              {/*<div className="space-y-2">*/}
              {/*  <label htmlFor="name" className="block text-sm font-medium text-gray-700">*/}
              {/*    실명 <span className="text-red-500">*</span>*/}
              {/*  </label>*/}
              {/*  <Input*/}
              {/*    id="name"*/}
              {/*    type="text"*/}
              {/*    placeholder="실명을 입력하세요"*/}
              {/*    value={name}*/}
              {/*    onChange={(e) => setName(e.target.value)}*/}
              {/*    required*/}
              {/*  />*/}
              {/*</div>*/}

              <div className="space-y-2">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={nickname}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length > 20) {
                        toast({
                          title: "닉네임 길이 초과",
                          description: "닉네임은 20자 이내로 입력해주세요.",
                          variant: "destructive",
                        })
                        return;
                      }
                      setNickname(e.target.value);
                      // 닉네임이 변경되면 중복 확인 상태 초기화
                      setIsNicknameAvailable(false);
                      setNicknameMessage("");
                    }}
                    required
                  />
                  {isNicknameAvailable ? (
  <div className="bg-green-100 rounded-md px-2 py-1 flex items-center whitespace-nowrap">
    <Check className="h-4 w-4 text-green-500 mr-1" />
    <span className="text-xs text-green-600">사용 가능</span>
  </div>
) : (
  <Button 
    type="button" 
    onClick={checkNickname} 
    disabled={isCheckingNickname || !nickname} 
    className="whitespace-nowrap"
  >
    {isCheckingNickname ? "확인 중..." : "중복 확인"}
  </Button>
) }
                </div>
                {nicknameMessage && (
                  <p className={`text-xs ${isNicknameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                    {isNicknameAvailable && <Check className="h-3 w-3 inline mr-1" />}
                    {nicknameMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  required
                />
                {phone && !isPhoneValid(phone) && (
                  <p className="text-red-500 text-xs">올바른 전화번호 형식이 아닙니다.</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  비밀번호는 8자 이상이며, 숫자와 특수문자를 포함해야 합니다.
                </div>

                <div className="flex space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    <div className={`h-1 w-4 rounded ${password.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <p className={`text-xs ${password.length >= 8 ? "text-green-500" : "text-gray-500"}`}>8자 이상</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`h-1 w-4 rounded ${/\d/.test(password) ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <p className={`text-xs ${/\d/.test(password) ? "text-green-500" : "text-gray-500"}`}>숫자</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`h-1 w-4 rounded ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <p className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-500" : "text-gray-500"}`}>특수문자</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !doPasswordsMatch() && (
                  <p className="text-red-500 text-xs">비밀번호가 일치하지 않습니다.</p>
                )}
                {confirmPassword && doPasswordsMatch() && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-green-500">비밀번호 일치</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked)}
                  required
                />
                <label htmlFor="agree-terms" className="text-sm text-gray-600">
                  <span className="text-red-500">(필수)</span> 이용약관 동의
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTermsModalType("terms")
                    setTermsModalOpen(true)
                  }}
                  className="text-xs text-blue-600 ml-auto hover:text-blue-800"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-privacy"
                  checked={agreePrivacy}
                  onCheckedChange={(checked) => setAgreePrivacy(checked)}
                  required
                />
                <label htmlFor="agree-privacy" className="text-sm text-gray-600">
                  <span className="text-red-500">(필수)</span> 개인정보 처리방침 동의
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTermsModalType("privacy")
                    setTermsModalOpen(true)
                  }}
                  className="text-xs text-blue-600 ml-auto hover:text-blue-800"
                >
                  보기
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-marketing"
                  checked={agreeMarketing}
                  onCheckedChange={(checked) => setAgreeMarketing(checked)}
                />
                <label htmlFor="agree-marketing" className="text-sm text-gray-600">
                  (선택) 마케팅 정보 수신 동의
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-navy-600 text-white hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600" 
              disabled={isLoading}
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">간편 가입</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <SocialLoginButton provider="kakao" isSignup />
              {/*<SocialLoginButton provider="naver" isSignup />*/}
              <SocialLoginButton provider="google" isSignup />
              <SocialLoginButton provider="apple" isSignup />
            </div>
          </div>

          {/* 로그인 링크 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-800">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* 약관 모달 */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type={termsModalType}
      />
    </div>
  )
}
