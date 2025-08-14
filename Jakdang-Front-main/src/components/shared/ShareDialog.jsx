"use client"

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import { 
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon, 
  LineShareButton, LineIcon 
} from "react-share";

export default function ShareDialog({ 
  isOpen, 
  onOpenChange, 
  post,
}) {
  const { toast } = useToast();
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [kakaoInitialized, setKakaoInitialized] = useState(false);
  const [hasKakaoKey, setHasKakaoKey] = useState(false);
  const [shareUrl, setShareUrl] = useState("");


  // 카카오 SDK 로드
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_APP_KEY;
    const isValidKey = apiKey && apiKey !== "YOUR_KAKAO_APP_KEY_HERE";
    setHasKakaoKey(isValidKey);
    
    if (!isValidKey) {
      console.warn("카카오 API 키가 설정되지 않았습니다. 카카오 공유 기능이 비활성화됩니다.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      setKakaoLoaded(true);
      
      if (window.Kakao && !window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(apiKey);
          setKakaoInitialized(true);
          console.log("카카오 SDK 초기화 완료");
          
          // 추가: 카카오톡 로그인 상태 확인
          window.Kakao.Auth.getStatusInfo((status) => {
            console.log("카카오톡 로그인 상태:", status);
          });
        } catch (error) {
          console.error("카카오 SDK 초기화 실패:", error);
        }
      }
    };
    
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);


  useEffect(()=>{
    setShareUrl(window.location.origin + "/post/" + post.id);
    console.log(window.location.origin + "/post/" + post.id);
  },[])

  // 디바이스 체크 함수 추가
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "");
  };

  // 카카오톡 공유하기
  const shareKakao = async () => {
    if (!hasKakaoKey) {
      toast({
        title: "카카오톡 공유 불가",
        description: "카카오 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        variant: "error",
      });
      return;
    }
    
    if (!kakaoLoaded || !kakaoInitialized) {
      toast({
        title: "카카오톡 공유 실패",
        description: "카카오톡 SDK를 불러오는데 실패했습니다.",
        variant: "error",
      });
      return;
    }

    try {
      if (isMobile()) {

        // 파일에서 이미지만 추출
        const images = (post.files || [])
            .filter(file => file.type === "image" && file.address)  // 이미지 타입 + 주소 있는 것만
            .slice(0, 3)  // 최대 3개까지만

        // 이미지 주소를 Image1, Image2, Image3 키로 매핑
        const imageArgs = {};
        images.forEach((file, index) => {
          imageArgs[`Image${index + 1}`] = file.address;
        });

        window.Kakao.Share.sendCustom({
          templateId: 120225,
          templateArgs: {
            userName: post.author.nickname || "사용자",
            title: post.title,
            description: stripHtml(post.contents),
            imageUrl: "https://jakdanglabs.com/logo.png",
            likeCount: post.like_count,
            commentCount: post.comment_count,
            shareCount: "0",
            userImage: post.author.image
                ? post.author.image
                : "https://nutag-files.s3.ap-northeast-2.amazonaws.com/nutag_1745928336216__4334__.png",
            shareUrl: "post/" + post.id, // 정규화된 URL 사용
            ...imageArgs  // 이미지 매핑한 거 추가
          }
        });
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "링크 복사 완료",
            description: "클립보드에 링크가 복사되었습니다. 카카오톡에 붙여넣기 하실 수 있습니다.",
            variant: "success",
          });
        } catch (clipboardError) {
          // 클립보드 복사 실패 시 fallback
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            toast({
              title: "링크 복사 완료",
              description: "클립보드에 링크가 복사되었습니다. 카카오톡에 붙여넣기 하실 수 있습니다.",
              variant: "success",
            });
          } catch (fallbackError) {
            toast({
              title: "링크 복사 실패",
              description: "링크 복사에 실패했습니다. 직접 URL을 복사해주세요.",
              variant: "error",
            });
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error("카카오톡 공유 오류:", error);
      
      toast({
        title: "공유 실패",
        description: "공유 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  // 링크 복사 함수 수정
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "링크 복사 성공",
        description: "클립보드에 링크가 복사되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast({
        title: "링크 복사 실패",
        description: "링크를 복사하는데 실패했습니다.",
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="dark:text-white">공유하기</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* 카카오톡 공유 */}
            <Button 
              onClick={shareKakao} 
              id="kakao-share-button"
              variant="outline" 
              className={`w-12 h-12 rounded-full p-0 border-none flex items-center justify-center ${
                hasKakaoKey ? 'bg-[#FEE500]' : 'bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!hasKakaoKey}
              title={!hasKakaoKey ? "카카오 API 키가 설정되지 않았습니다" : "카카오톡으로 공유하기"}
            >
              <svg width="24" height="24" viewBox="0 0 256 256" fill="none">
                <path d="M128 36C70.562 36 24 72.713 24 118C24 147.67 44.449 173.39 74.285 186.979C72.573 194.324 66.285 219.287 65.262 223.203C64.031 227.949 67.188 227.883 69.59 226.258C71.402 225.016 99.566 204.223 109.453 197.223C115.461 198.172 121.651 198.695 128 198.695C185.438 198.695 232 162.004 232 116.695C232 71.387 185.438 36 128 36Z" fill="currentColor"/>
              </svg>
            </Button>
            
            {/* 페이스북 공유 */}
            <FacebookShareButton url={shareUrl} quote={"post.title"} className="w-12 h-12 rounded-full">
              <FacebookIcon size={48} round />
            </FacebookShareButton>
            
            {/* 트위터 공유 */}
            <TwitterShareButton url={shareUrl} title={"post.title"} className="w-12 h-12 rounded-full">
              <TwitterIcon size={48} round />
            </TwitterShareButton>
            
            {/* 라인 공유 */}
            <LineShareButton url={shareUrl} title={"post.title"} className="w-12 h-12 rounded-full">
              <LineIcon size={48} round />
            </LineShareButton>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button
              onClick={copyToClipboard}
              className="w-full bg-navy-600 hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600 dark:text-white"
            >
              링크 복사하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 