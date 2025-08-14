import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query.jsx";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/jotai/authAtoms";

// 개발 환경에서 강제로 웹뷰 모드로 설정할지 여부 (테스트용)
const DEBUG_AS_WEBVIEW = false;

export default function FloatingWriteButton() {
  const [isWebView, setIsWebView] = useState(true);
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const [showButton, setShowButton] = useState(false);
  
  const pathname = location.pathname;
  
  // 플러터 웹뷰 감지 및 경로 체크
  useEffect(() => {
    // 웹뷰 상태 감지를 위한 함수 등록
    if (!window.appBridge) {
      window.appBridge = {};
    }
    
    // 디버그 모드일 경우 웹뷰 상태로 설정
    if (DEBUG_AS_WEBVIEW) {
      window.appBridge._isWebView = true;
      setIsWebView(true);
    }
    
    // 이미 존재하는 hideNavFooter 함수를 확장
    const originalHideNavFooter = window.appBridge.hideNavFooter;
    window.appBridge.hideNavFooter = () => {
      if (originalHideNavFooter) originalHideNavFooter();
      window.appBridge._isWebView = true;
      setIsWebView(true);
    };
    
    // 이미 존재하는 showNavFooter 함수를 확장
    const originalShowNavFooter = window.appBridge.showNavFooter;
    window.appBridge.showNavFooter = () => {
      if (originalShowNavFooter) originalShowNavFooter();
      window.appBridge._isWebView = false;
      setIsWebView(false);
    };
    
    // 기존 상태 확인
    if (window.appBridge._isWebView) {
      setIsWebView(true);
    }
    
    // 해당 경로에서만 버튼 표시 (정확한 경로 매칭)
    const checkPath = () => {
      // 홈(/) 또는 채널(/channel/...) 경로인 경우에만 표시
      const shouldShow = 
        pathname === "/" || // 정확히 홈 경로
        pathname.startsWith("/channel/"); // channel로 시작하는 경로
      
      setShowButton(shouldShow && isAuth);
    };
    
    checkPath();
  }, [pathname, isAuth]);
  
  // 글쓰기 모달 열기
  const handleWriteClick = () => {
    if (window.appBridge && window.appBridge.openWriteModal) {
      window.appBridge.openWriteModal();
    }
  };
  
  // 디버그 모드 또는 실제 웹뷰에서만 표시
  if ((!isWebView || !showButton) && !DEBUG_AS_WEBVIEW) return null;
  
  // 모바일 환경이 아니면 표시하지 않음 (단, 디버그 모드 제외)
  if (!isMobile && !DEBUG_AS_WEBVIEW) return null;
  
  return (
    <div className="fixed bottom-2 right-2 z-50">
      <Button
        onClick={handleWriteClick}
        className="w-14 h-14 rounded-full bg-navy-600 hover:bg-navy-700 shadow-lg"
      >
        <Plus className="w-7 h-7 text-white" />
      </Button>
    </div>
  );
} 