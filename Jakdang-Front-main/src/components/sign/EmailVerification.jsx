import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEmailVerificationApi } from "@/service/api/emailVerificationApi"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"

/**
 * 이메일 인증 컴포넌트
 * @param {string} email - 인증할 이메일 주소
 * @param {Function} onVerificationComplete - 인증 완료 시 호출되는 콜백
 * @param {Function} onError - 에러 발생 시 호출되는 콜백
 * @param {boolean} buttonOnly - 버튼만 표시할지 여부
 * @param {boolean} inputOnly - 인증 코드 입력 영역만 표시할지 여부
 * @param {boolean} noButton - 버튼을 표시하지 않을지 여부 (외부에서 버튼을 제공하는 경우)
 */
const EmailVerification = forwardRef(({ 
  email, 
  onVerificationComplete, 
  onError, 
  buttonOnly = false, 
  inputOnly = false,
  noButton = false
}, ref) => {
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState({
    sent: false,
    error: null,
  })

  const { 
    sendVerificationCode: apiSendVerificationCode, 
    verifyCode, 
    checkVerificationStatus 
  } = useEmailVerificationApi()

  // 외부에서 함수를 호출할 수 있도록 노출
  useImperativeHandle(ref, () => ({
    sendVerificationCode: handleSendVerificationCode
  }));

  // 컴포넌트 마운트 시 이메일 인증 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      if (!email || !isEmailValid(email) || !checkVerificationStatus) return

      try {
        const result = await checkVerificationStatus(email)
        if (result && result.success && result.data === true) {
          setIsEmailVerified(true)
          onVerificationComplete && onVerificationComplete(true)
        }
      } catch (error) {
        console.error("인증 상태 확인 실패:", error)
      }
    }

    checkStatus()
  }, [email, checkVerificationStatus, onVerificationComplete])

  // 타이머 설정
  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [timer])

  // 이메일 유효성 검사
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 인증 코드 발송
  const handleSendVerificationCode = async () => {
    if (!email || !isEmailValid(email)) {
      const errorMessage = "유효한 이메일 주소를 입력해주세요."
      setVerificationStatus({
        sent: false,
        error: errorMessage
      })
      onError && onError(errorMessage)
      return
    }

    if (!apiSendVerificationCode) {
      const errorMessage = "인증 코드 발송 기능을 사용할 수 없습니다."
      setVerificationStatus({
        sent: false,
        error: errorMessage
      })
      onError && onError(errorMessage)
      return
    }

    setIsSending(true)
    setVerificationStatus({
      sent: false,
      error: null,
    })

    try {
      const response = await apiSendVerificationCode(email)
      
      // 백엔드 API가 { resultCode: 200, resultMessage: "..." } 형태로 반환하는 경우
      if (response && response.result && response.response) {
        const apiResponse = response.response;
        
        // resultCode가 200이면 성공으로 처리
        if (apiResponse.resultCode === 200) {
          setVerificationStatus({
            sent: true,
            error: null,
          })
          setTimer(600) // 10분(600초) 타이머 시작
        } else {
          const errorMessage = apiResponse.resultMessage || "인증 코드 발송에 실패했습니다."
          setVerificationStatus({
            sent: false,
            error: errorMessage,
          })
          onError && onError(errorMessage)
        }
      } else {
        const errorMessage = "인증 코드 발송에 실패했습니다."
        setVerificationStatus({
          sent: false,
          error: errorMessage,
        })
        onError && onError(errorMessage)
      }
    } catch (error) {
      console.error("인증 코드 발송 오류:", error)
      setVerificationStatus({
        sent: false,
        error: "인증 코드 발송 중 오류가 발생했습니다.",
      })
      onError && onError("인증 코드 발송 중 오류가 발생했습니다.")
    } finally {
      setIsSending(false)
    }
  }

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      const errorMessage = "인증 코드를 입력해주세요."
      setVerificationStatus({
        ...verificationStatus,
        error: errorMessage,
      })
      onError && onError(errorMessage)
      return
    }

    if (!verifyCode) {
      const errorMessage = "인증 코드 확인 기능을 사용할 수 없습니다."
      setVerificationStatus({
        ...verificationStatus,
        error: errorMessage,
      })
      onError && onError(errorMessage)
      return
    }

    setIsVerifying(true)
    setVerificationStatus({
      ...verificationStatus,
      error: null,
    })

    try {
      const response = await verifyCode(email, verificationCode)
      
      // 백엔드 API가 { resultCode: 200, resultMessage: "..." } 형태로 반환하는 경우
      if (response && response.result && response.response) {
        const apiResponse = response.response;
        
        // resultCode가 200이면 성공으로 처리
        if (apiResponse.resultCode === 200) {
          setIsEmailVerified(true)
          setVerificationStatus({
            sent: true,
            error: null,
          })
          onVerificationComplete && onVerificationComplete(true)
        } else {
          const errorMessage = apiResponse.resultMessage || "인증 코드가 유효하지 않습니다."
          setVerificationStatus({
            ...verificationStatus,
            error: errorMessage,
          })
          onError && onError(errorMessage)
        }
      } else {
        const errorMessage = "인증 코드 확인에 실패했습니다."
        setVerificationStatus({
          ...verificationStatus,
          error: errorMessage,
        })
        onError && onError(errorMessage)
      }
    } catch (error) {
      console.error("인증 코드 확인 오류:", error)
      setVerificationStatus({
        ...verificationStatus,
        error: "인증 코드 확인 중 오류가 발생했습니다.",
      })
      onError && onError("인증 코드 확인 중 오류가 발생했습니다.")
    } finally {
      setIsVerifying(false)
    }
  }

  // 타이머 포맷팅 (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (isEmailVerified) {
    return null // 인증이 완료되면 아무것도 렌더링하지 않음
  }

  // 버튼만 표시
  if (buttonOnly) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={handleSendVerificationCode}
        disabled={isSending || !isEmailValid(email) || !apiSendVerificationCode}
        className="whitespace-nowrap"
      >
        {isSending ? "발송 중..." : verificationStatus.sent ? "재발송" : "인증코드 발송"}
      </Button>
    )
  }

  // 인증 코드 입력 영역만 표시
  if (inputOnly || noButton) {
    if (!verificationStatus.sent) {
      return (
        <div className="space-y-1">
          {verificationStatus.error && (
            <p className="text-xs text-red-500">{verificationStatus.error}</p>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          인증코드 유효시간: {formatTime(timer)}
        </div>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="인증 코드 입력"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleVerifyCode}
            disabled={isVerifying || !verificationCode || !verifyCode}
            className="whitespace-nowrap"
          >
            {isVerifying ? "확인 중..." : "확인"}
          </Button>
        </div>
        {verificationStatus.error && (
          <p className="text-xs text-red-500">{verificationStatus.error}</p>
        )}
      </div>
    )
  }

  // 기본 렌더링 (전체 컴포넌트)
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSendVerificationCode}
          disabled={isSending || !isEmailValid(email) || !apiSendVerificationCode}
          className="whitespace-nowrap"
        >
          {isSending ? "발송 중..." : verificationStatus.sent ? "재발송" : "인증코드 발송"}
        </Button>
        
        {verificationStatus.sent && (
          <p className="text-xs text-gray-500">
            인증코드 유효시간: {formatTime(timer)}
          </p>
        )}
      </div>

      {verificationStatus.sent && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="인증 코드 입력"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleVerifyCode}
              disabled={isVerifying || !verificationCode || !verifyCode}
              className="whitespace-nowrap"
            >
              {isVerifying ? "확인 중..." : "확인"}
            </Button>
          </div>
          {verificationStatus.error && (
            <p className="text-xs text-red-500">{verificationStatus.error}</p>
          )}
        </div>
      )}
    </div>
  )
});

export default EmailVerification; 