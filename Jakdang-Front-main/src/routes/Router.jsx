"use client";
import FloatingWriteButton from "@/components/FloatingWriteButton";
import WriteModal from "@/components/modal/write-modal/write-modal.jsx";
import OAuthCallback from "@/components/sign/OAuthCallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import {
  accessTokenAtom,
  isAuthenticatedAtom,
  userInfoAtom,
  isTokenLoadingAtom, // 새로운 atom import 추가
} from "@/jotai/authAtoms";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ForgotPassword from "@/pages/auth/ForgotPassword.jsx";
import ChannelPage from "@/pages/channel/page";
import DiscordClone from "@/pages/chatv2/page";
import CommunityPage from "@/pages/community/page.jsx";
import LoginPage from "@/pages/login/loginPage";
import SignupPage from "@/pages/login/signUpPage";
import MyPage from "@/pages/my/page";
import UserProfile from "@/pages/my/userPage";
import AssignmentDetailPage from "@/pages/organization/assignment/page";
import OrganizationDetailPage from "@/pages/organization/details/page.jsx";
import MaterialDetailPage from "@/pages/organization/material/page";
import NoticeDetailPage from "@/pages/organization/notice/page";
import OrganizationPage from "@/pages/organization/page";
import QuestionDetailPage from "@/pages/organization/question/page";
import OrganizationsPage from "@/pages/organizations/page.jsx";
import SearchPage from "@/pages/organizations/searchPage";
import HomePage from "@/pages/page";
import ForbiddenPage from "@/pages/page403";
import NotFoundPage from "@/pages/page404"; // 404 페이지 추가 (실제 파일 생성 필요)
import PostDetailPage from "@/pages/post/detail/page";
import WritePage from "@/pages/write/page";
import WriteQuestionPage from "@/pages/write/question/page";
import MainInfo from "@/pages/info/maininfo";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getDefaultStore } from "jotai"; // jotaiStore 접근을 위한 import 추가
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Footer from "../components/global/footer";
import Navbar from "../components/global/navbar";
import NoticePage from "@/pages/notice/noticePage.jsx";
import HomeNoticeDetailPage from "@/pages/notice/noticeDetailPage.jsx";
import ChannelInfoPage from "@/pages/channel/info.jsx";
import PopupLayout from "@/components/layout/PopupLayout.jsx";
import PopupChatList from "@/pages/popup-chat/PopupChatList.jsx";
import PopupChatRoom from "@/pages/popup-chat/PopupChatRoom.jsx";
import axios from "axios";

const jotaiStore = getDefaultStore(); // jotaiStore 초기화

// Layout component
const Layout = () => {
  const [isWebView, setIsWebView] = useState(true);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [accessTokenValue, setAccessToken] = useAtom(accessTokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);
  const { fetchGet } = useAxiosQuery();
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenLoading, setIsTokenLoading] = useAtom(isTokenLoadingAtom); // 토큰 로딩 상태 사용

  // 페이지 이동 시 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // isAuthenticated 값이 변경될 때마다 로그 출력
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  useEffect(() => {
    console.log("로그인 상태 변경:", isAuthenticated);
  }, [isAuthenticated]);

  // 쿼리 파라미터에서 토큰 확인
  useEffect(() => {
    const checkQueryParams = async () => {
      try {
        setIsTokenLoading(true); // 토큰 로딩 시작
        console.log("현재 로그인 상태:", !!accessTokenValue);
        
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
          console.log("URL 쿼리 파라미터에서 토큰을 찾았습니다.");
          console.log("토큰:", token.substring(0, 15) + "...");
          
          // 로컬 스토리지에 토큰 저장
          localStorage.setItem('access-token', token);
          console.log("로컬 스토리지에 토큰 저장됨");
          
          // 플러터 웹뷰용 특수 처리: 토큰을 직접 상태로 설정 (로컬 스토리지 외에 추가로)
          setAccessToken(token.startsWith('Bearer ') ? token : `Bearer ${token}`);
          console.log("토큰을 상태에 직접 설정 (플러터 웹뷰 호환성)");
          
          // 사용자 정보 가져오기
          try {
            // 토큰 Bearer 형식 확인
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            console.log("포맷된 토큰:", formattedToken.substring(0, 15) + "...");
            
            // 직접 axios 인스턴스 생성 (인터셉터 없이)
            const directAxios = axios.create({
              baseURL: import.meta.env.VITE_API_URL,
              headers: {
                "Content-Type": "application/json",
                "Authorization": formattedToken
              }
            });
            
            const res = await directAxios.get(
              `/auth/get-info`
            );
            if (res.data) {
              console.log("사용자 정보 응답:", res.data);
              
              // 토큰 먼저 설정 (isAuthenticatedAtom이 accessTokenAtom에 의존)
              const tokenToStore = res.headers.authorization || formattedToken;
              console.log("저장할 토큰:", tokenToStore.substring(0, 15) + "...");
              setAccessToken(tokenToStore);
              console.log("토큰 저장 완료");
              
              // 사용자 정보 설정
              try {
                const decodedToken = jwtDecode(token);
                console.log("디코딩된 토큰 userId:", decodedToken.userId);
                
                setUserInfo({
                  ...res.data.data,
                  userId: decodedToken.userId,
                });
                console.log("사용자 정보 저장 완료");
                
                // 성공적으로 로그인 처리됐는지 확인
                setTimeout(() => {
                  const currentAuth = jotaiStore.get(isAuthenticatedAtom);
                  console.log("로그인 처리 후 인증 상태:", currentAuth);
                }, 100);
              } catch (decodeError) {
                console.error("토큰 디코딩 실패:", decodeError);
              }
              
              // 토큰 파라미터 제거 (보안을 위해)
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          } catch (error) {
            console.error("사용자 정보 가져오기 실패:", error);
          }
        } else {
          try {
            const res = await fetchGet(`${import.meta.env.VITE_API_URL}/auth/get-info`);
            if (res?.data) {
              console.log("사용자 정보:", res.data);
              // 토큰이 없는 상태에서도 정보를 가져오는 경우(이미 로그인된 상태)
              const userId = res.data.id || res.data.userId;
              setUserInfo({
                ...res.data,
                userId: userId,
              });
              console.log("이미 로그인된 사용자 정보 업데이트 완료");
            }
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log("URL 쿼리 파라미터에 토큰이 없습니다.");
          } catch (error) {
            console.log("로그인이 필요합니다.");
          }
        }

        // 로딩 상태 해제
        setIsLoading(false);
        setIsTokenLoading(false); // 토큰 로딩 완료
      } catch (error) {
        console.error("쿼리 파라미터 처리 중 오류 발생:", error);
        setIsLoading(false);
        setIsTokenLoading(false); // 에러 발생해도 토큰 로딩 완료 처리
      }
    };

    // 페이지 로드 시 쿼리 파라미터 확인
    checkQueryParams();
  }, [/* 의존성 배열이 빈 배열이어야 처음 한 번만 실행됨 */]);

  useEffect(() => {
    // 웹뷰에서 호출할 함수를 전역으로 등록
    if (!window.appBridge) {
      window.appBridge = {};
    }

    window.appBridge = {
      ...window.appBridge,
      hideNavFooter: () => {
        setIsWebView(true);
        window.appBridge._isWebView = true;
      },
      showNavFooter: () => {
        setIsWebView(false);
        window.appBridge._isWebView = false;
      },
      navigateTo: (path) => {
        navigate(path);
      },
      openWriteModal: () => {
        setWriteModalOpen(true);
      },
    };
  }, [navigate]);

  // 로딩 중일 때 표시할 UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        로딩 중...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Outlet />
      {/*{!isWebView && location.pathname !== '/chat' && <Footer />}*/}
      {/*{!isWebView && <Footer />}*/}
      <Footer />
      <FloatingWriteButton />
      <WriteModal
        Id={null}
        fromComponent={"channel"}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
      />
      <AuthLogger />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [showAlert, setShowAlert] = useState(false);
  const [initialized, setInitialized] = useState(false); // useEffect 한 번만 실행되게

  useEffect(() => {
    // 한번만 실행되게 보장
    if (initialized) return;

    // 로그인된 상태에서만 조건 확인
    if (isAuthenticated) {
      // 경로가 로그인/회원가입이면 Alert 띄움
      if (
        location.pathname === "/auth/login" ||
        location.pathname === "/auth/signup"
      ) {
        setShowAlert(true);
      } else {
        // 리디렉션 상황이면 그냥 홈으로 보냄
        // This part might need review depending on intended behavior
        // navigate('/', { replace: true });
      }
    }

    setInitialized(true);
  }, [isAuthenticated, location.pathname, navigate, initialized]);

  const handleContinue = () => {
    setShowAlert(false);
    navigate("/", { replace: true });
  };

  if (showAlert) {
    return (
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>접근 제한</AlertDialogTitle>
            <AlertDialogDescription>
              이미 로그인되어 있습니다. 로그인 및 회원가입 페이지는 로그아웃
              상태에서만 접근할 수 있습니다. 홈으로 이동합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleContinue}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // 로그인 안 된 경우에는 자식 컴포넌트 정상 렌더링
  // 로그인 된 경우 /auth/login, /auth/signup 접근 시 null 반환 (Alert 처리 후)
  return !isAuthenticated || !showAlert ? children : null;
};

// 인증이 필요한 경로를 위한 컴포넌트
const AuthRequiredRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAlert(true);
    } else {
      setShowAlert(false); // Hide alert if authenticated
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setShowAlert(false);
    navigate("/login");
  };

  // 인증되지 않은 사용자는 Alert 표시
  if (!isAuthenticated && showAlert) {
    return (
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인 필요</AlertDialogTitle>
            <AlertDialogDescription>
              이 페이지에 접근하려면 로그인이 필요합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleLogin}>
              로그인 페이지로 이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // 인증된 사용자만 자식 컴포넌트 렌더링
  return isAuthenticated ? children : null;
};

// 디버깅 목적의 로그 컴포넌트
const AuthLogger = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const token = useAtomValue(accessTokenAtom);
  const userInfo = useAtomValue(userInfoAtom);
  
  useEffect(() => {
    console.log("AuthLogger - 인증 상태:", isAuthenticated);
    console.log("AuthLogger - 토큰 존재 여부:", !!token);
    if (token) {
      console.log("AuthLogger - 토큰 맨 앞 부분:", token.substring(0, 15) + "...");
    }
    console.log("AuthLogger - 사용자 정보:", userInfo);
    
    // localStorage에 저장된 토큰 확인
    const localToken = localStorage.getItem('access-token');
    console.log("AuthLogger - localStorage 토큰 존재 여부:", !!localToken);
    if (localToken) {
      console.log("AuthLogger - localStorage 토큰 맨 앞 부분:", localToken.substring(0, 15) + "...");
    }
  }, [isAuthenticated, token, userInfo]);
  
  return null;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login/oauth2/code/:provider",
        element: <OAuthCallback />,
      },
      {
        path: "auth",
        children: [
          {
            path: "login",
            element: (
              <ProtectedRoute>
                <LoginPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "signup",
            element: (
              <ProtectedRoute>
                <SignupPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "forgot-password",
            element: <ForgotPassword />, // Consider if this needs ProtectedRoute logic
          },
        ],
      },
      // Redirects for old paths
      {
        path: "login",
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "signup",
        element: <Navigate to="/auth/signup" replace />,
      },
      {
        path: "forgot-password",
        element: <Navigate to="/auth/forgot-password" replace />,
      },
      {
        path: "channel",
        element: <ChannelInfoPage />,
      },
      {
        path: "channel/:id",
        element: <ChannelPage />,
      },
      {
        path: "community",
        element: (
          <AuthRequiredRoute>
            <CommunityPage />
          </AuthRequiredRoute>
        ),
      },
      {
        path: "chat",
        element: (
          <AuthRequiredRoute>
            <DiscordClone />
          </AuthRequiredRoute>
        ),
      },
      {
        path: "my",
        element: (
          <AuthRequiredRoute>
            <MyPage />
          </AuthRequiredRoute>
        ),
      },
      {
        path: "profile/:id",
        element: <UserProfile />,
      },
      {
        path: "forbidden",
        element: <ForbiddenPage />,
      },
      {
        path: "organization",
        children: [
          {
            path: ":id",
            element: <OrganizationPage />,
          },
          {
            path: "details/:id",
            element: <OrganizationDetailPage />,
          },
          {
            path: "assignment/:id",
            element: <AssignmentDetailPage />,
          },
          {
            path: "material/:id",
            element: <MaterialDetailPage />,
          },
          {
            path: "notice/:id",
            element: <NoticeDetailPage />,
          },
          {
            path: "question/:id",
            element: <QuestionDetailPage />,
          },
        ],
      },
      {
        path: "organizations",
        element: <OrganizationsPage />,
      },
      {
        path: "organizations/search",
        element: <SearchPage />,
      },
      {
        path: "write",
        children: [
          {
            index: true,
            element: (
              <AuthRequiredRoute>
                <WritePage />
              </AuthRequiredRoute>
            ),
          },
          {
            path: "question",
            element: (
              <AuthRequiredRoute>
                <WriteQuestionPage />
              </AuthRequiredRoute>
            ),
          },
        ],
      },
      {
        path: "terms",
        element: <TermsOfService />,
      },
      {
        path: "privacy",
        element: <PrivacyPolicy />,
      },
      {
        path: "post/:postId",
        element: <PostDetailPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
      {
        path: "notice",
        children: [
          {
            index: true,
            element: <NoticePage />,
          },
          {
            path: ":id",
            element: <HomeNoticeDetailPage />,
          },
        ],
      },
      {
  path: "info",
  element: <MainInfo />,
},
    ],  },
  // 팝업 라우트 (레이아웃 없음)
  {
    path: "/popup-chat",
    element: <PopupLayout />,
    children: [
      {
        index: true,
        element: (
          <AuthRequiredRoute>
            <PopupChatList />
          </AuthRequiredRoute>
        ),
      },
      {
        path: "room/:roomId",
        element: (
          <AuthRequiredRoute>
            <PopupChatRoom />
          </AuthRequiredRoute>
        ),
      },
    ],
  },
]);
