import { useAxiosQuery } from '@/hooks/useAxiosQuery';
import { useCallback } from 'react';

export const useAuthApi = () => {
  const { usePost } = useAxiosQuery();

  // 1. 비밀번호 재설정 이메일 요청
  const requestPasswordResetMutation = usePost();

  // 2. 비밀번호 재설정
  const resetPasswordMutation = usePost();

  // 래퍼 함수 (사용 예: await requestPasswordReset({ email }) )
  const requestPasswordReset = useCallback(async ({ email }) => {
    return await requestPasswordResetMutation.mutateAsync({
      endPoint: '/auth/password/request-reset',
      data: { email },
    });
  }, [requestPasswordResetMutation]);

  const resetPassword = useCallback(async ({ email, code, newPassword }) => {
    return await resetPasswordMutation.mutateAsync({
      endPoint: '/auth/password/reset',
      data: { email, code, newPassword },
    });
  }, [resetPasswordMutation]);

  return {
    requestPasswordReset,
    resetPassword,
    isRequesting: requestPasswordResetMutation.isLoading,
    isResetting: resetPasswordMutation.isLoading,
  };
};
