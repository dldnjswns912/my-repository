import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/toast-provider';
import { useAuthApi } from '@/service/api/authApi';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증코드+새비번 입력
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { requestPasswordReset, resetPassword, isRequesting, isResetting } = useAuthApi();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 이메일로 인증코드 요청
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await requestPasswordReset({ email });
      if (res.response?.resultCode === 200) {
        setStep(2);
        setMessage(res.response?.resultMessage || '이메일로 인증코드를 발송했습니다. 메일함을 확인하세요.');
      } else {
        setError(res.response?.resultMessage || '인증코드 발송에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    }
  }; 

  // 인증코드+새 비밀번호로 재설정
  // 비밀번호 유효성 검사 (회원가입과 동일)
  const isPasswordValid = (pw) => {
    const minLength = pw.length >= 8;
    const hasNumber = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    return minLength && hasNumber && hasSpecial;
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!isPasswordValid(newPassword)) {
      setError('비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const res = await resetPassword({ email, code, newPassword });
      if (res.response?.resultCode === 200) {
        toast({
          title: '비밀번호 변경 완료',
          description: '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.',
          variant: 'default',
        });
        navigate('/login');
      } else {
        setError(res.response?.resultMessage || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    }
  }; 

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">비밀번호 찾기</h2>
        {step === 1 && (
          <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
            <label className="text-sm font-semibold">가입한 이메일</label>
            <input
              type="email"
              className="border rounded px-3 py-2 focus:outline-none focus:ring"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="이메일을 입력하세요"
            />
            <button
              type="submit"
              className="mt-2 bg-navy-600 text-white py-2 rounded hover:bg-navy-700 font-semibold"
              disabled={isRequesting}
            >
              {isRequesting ? '전송 중...' : '인증코드 메일 받기'}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <label className="text-sm font-semibold">이메일</label>
            <input
              type="email"
              className="border rounded px-3 py-2 bg-gray-100"
              value={email}
              disabled
            />
            <label className="text-sm font-semibold">이메일 인증코드</label>
            <input
              type="text"
              className="border rounded px-3 py-2"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              placeholder="인증코드를 입력하세요"
            />
            <label className="text-sm font-semibold">새 비밀번호</label>
            <input
              type="password"
              className="border rounded px-3 py-2"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="새 비밀번호를 입력하세요"
            />
            {/* 비밀번호 조건 안내 및 실시간 체크 */}
            <div className="text-xs text-gray-500 mt-1">
              비밀번호는 8자 이상이며, 숫자와 특수문자를 포함해야 합니다.
            </div>
            <div className="flex space-x-4 mt-1">
              <div className="flex items-center space-x-1">
                <div className={`h-1 w-4 rounded ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <p className={`text-xs ${newPassword.length >= 8 ? "text-green-500" : "text-gray-500"}`}>8자 이상</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`h-1 w-4 rounded ${/\d/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                <p className={`text-xs ${/\d/.test(newPassword) ? "text-green-500" : "text-gray-500"}`}>숫자</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`h-1 w-4 rounded ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                <p className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-500" : "text-gray-500"}`}>특수문자</p>
              </div>
            </div>
            {/* 비밀번호 유효성 에러 메시지 */}
            {newPassword && !isPasswordValid(newPassword) && (
              <div className="text-xs text-red-600 mt-1">비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 합니다.</div>
            )}
            <label className="text-sm font-semibold">새 비밀번호 확인</label>
            <input
              type="password"
              className="border rounded px-3 py-2"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="새 비밀번호를 한 번 더 입력하세요"
            />
            {/* 비밀번호 일치 에러 메시지 */}
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="text-xs text-red-600 mt-1">비밀번호가 일치하지 않습니다.</div>
            )}
            <button
              type="submit"
              className="mt-2 bg-navy-600 text-white py-2 rounded hover:bg-navy-700 font-semibold"
              disabled={isResetting}
            >
              {isResetting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
        {message && <div className="text-green-600 text-center mt-4">{message}</div>}
        {/* error 메시지는 비밀번호 에러/불일치가 아닐 때만 하단에 표시 */}
        {error && (!newPassword || isPasswordValid(newPassword)) && (!confirmPassword || newPassword === confirmPassword) && (
          <div className="text-red-600 text-center mt-4">{error}</div>
        )}
      </div>
    </div>
  );
}
