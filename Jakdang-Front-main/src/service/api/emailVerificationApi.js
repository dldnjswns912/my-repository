import { useAxios } from '@/hooks/useAxios'

/**
 * 이메일 인증 관련 API 훅
 * @returns {Object} 이메일 인증 관련 API 함수들
 */
export const useEmailVerificationApi = () => {
  const { 
    fetchGet, 
    fetchPost, 
    getAxiosWithToken 
  } = useAxios()
  
  /**
   * 비밀번호 재설정 요청 (인증 코드 발송)
   * @param {string} email 사용자 이메일
   * @returns {Promise<Object>} 응답 결과
   */
  const sendPasswordResetRequest = async (email) => {
    try {
      return await fetchPost('/auth/password/reset-request', { email })
    } catch (error) {
      console.error('비밀번호 재설정 요청 오류:', error)
      return { 
        result: false, 
        response: { success: false, message: '서버 오류가 발생했습니다.' }
      }
    }
  }
  
  /**
   * 이메일 인증 코드 발송
   * @param {string} email 사용자 이메일
   * @returns {Promise<Object>} 응답 결과
   */
  const sendVerificationCode = async (email) => {
    try {
      return await fetchPost('/auth/email/send-verification', { email })
    } catch (error) {
      console.error('인증 코드 발송 오류:', error)
      return { 
        result: false, 
        response: { success: false, message: '서버 오류가 발생했습니다.' }
      }
    }
  }
  
  /**
   * 인증 코드 검증
   * @param {string} email 사용자 이메일
   * @param {string} code 인증 코드
   * @returns {Promise<Object>} 응답 결과
   */
  const verifyCode = async (email, code) => {
    try {
      return await fetchPost('/auth/email/verify', { email, code })
    } catch (error) {
      console.error('인증 코드 검증 오류:', error)
      return { 
        result: false, 
        response: { success: false, message: '서버 오류가 발생했습니다.' }
      }
    }
  }
  
  /**
   * 이메일 인증 상태 확인
   * @param {string} email 사용자 이메일
   * @returns {Promise<Object>} 응답 결과
   */
  const checkVerificationStatus = async (email) => {
    try {
      return await fetchGet(`/auth/email/check`, { email })
    } catch (error) {
      console.error('인증 상태 확인 오류:', error)
      return { success: false, message: '인증 상태 확인에 실패했습니다.', data: false }
    }
  }
  
  /**
   * 비밀번호 재설정
   * @param {string} email 사용자 이메일
   * @param {string} code 인증 코드
   * @param {string} newPassword 새 비밀번호
   * @returns {Promise<Object>} 응답 결과
   */
  const resetPassword = async (email, code, newPassword) => {
    try {
      return await fetchPost('/auth/password/reset', {
        email, 
        code, 
        newPassword 
      })
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      return { 
        result: false, 
        response: { success: false, message: '서버 오류가 발생했습니다.' }
      }
    }
  }
  
  return {
    sendPasswordResetRequest,
    sendVerificationCode,
    verifyCode,
    checkVerificationStatus,
    resetPassword
  }
} 