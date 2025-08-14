"use client";

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { isAuthenticatedAtom, accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms";

// 팝업 전용 레이아웃 (네비게이션 바, 푸터 제외)
export default function PopupLayout() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);  useEffect(() => {
    console.log('PopupLayout 초기화 시작');
      // 팝업 윈도우에서 부모 윈도우의 인증 정보 가져오기
    const getAuthFromParent = () => {
      // 부모 윈도우의 localStorage에서 토큰 가져오기
      if (window.opener) {
        try {
          const parentToken = window.opener.localStorage.getItem('access-token');
          const parentUserInfo = window.opener.localStorage.getItem('user-info');
          
          console.log('부모 윈도우 토큰:', parentToken ? '있음' : '없음');
          console.log('부모 윈도우 사용자 정보:', parentUserInfo ? '있음' : '없음');
          
          if (parentToken) {
            console.log('부모에서 토큰 설정');
            localStorage.setItem('access-token', parentToken);
            setAccessToken(parentToken);
          }
          
          if (parentUserInfo) {
            console.log('부모에서 사용자 정보 설정');
            localStorage.setItem('user-info', parentUserInfo);
            setUserInfo(JSON.parse(parentUserInfo));
          }
        } catch (error) {
          console.error('부모 윈도우 인증 정보 접근 실패:', error);
        }
      }      // 3. 로컬 스토리지에서 토큰 확인
      const localToken = localStorage.getItem('access-token');
      const localUserInfo = localStorage.getItem('user-info');
      
      console.log('로컬 토큰:', localToken ? '있음' : '없음');
      console.log('로컬 사용자 정보:', localUserInfo ? '있음' : '없음');

      if (localToken) {
        console.log('로컬에서 토큰 설정');
        setAccessToken(localToken);
      }
      
      if (localUserInfo) {
        console.log('로컬에서 사용자 정보 설정');
        try {
          const parsedUserInfo = JSON.parse(localUserInfo);
          setUserInfo(parsedUserInfo);
          console.log('사용자 정보 파싱 성공:', parsedUserInfo);
        } catch (error) {
          console.error('사용자 정보 파싱 실패:', error);
        }
      }
      
      // 초기화 완료 후 잠시 대기하여 atom 상태가 업데이트되도록 함
      setTimeout(() => {
        console.log('PopupLayout 인증 초기화 완료');
        setIsLoading(false);
      }, 100);
    };

    // 부모 윈도우로부터 메시지 수신
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, data } = event.data;
      console.log('PopupLayout 메시지 수신:', { type, data });
      
      if (type === 'AUTH_INFO' && data.token) {
        console.log('부모로부터 인증 정보 업데이트');
        localStorage.setItem('accessToken', data.token);
        setAccessToken(data.token);
        
        if (data.userInfo) {
          localStorage.setItem('userInfo', typeof data.userInfo === 'string' ? data.userInfo : JSON.stringify(data.userInfo));
          setUserInfo(typeof data.userInfo === 'string' ? JSON.parse(data.userInfo) : data.userInfo);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    getAuthFromParent();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setAccessToken, setUserInfo]);

  // 인증되지 않은 사용자는 부모 윈도우에서 로그인 페이지로 이동
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (window.opener) {
        // 부모 윈도우에서 로그인 페이지로 이동
        window.opener.location.href = '/login';
        window.close();
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <Outlet />
    </div>
  );
}
