import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import {
    Building2,
    ChevronRight,
    Home,
    MessageCircle,
    User,
    LogOut,
    ExternalLink,
    Users
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAtomValue, useAtom } from "jotai";
import {isAuthenticatedAtom, userInfoAtom} from "@/jotai/authAtoms";
import React, {useEffect} from "react";
import {useMyOrganizations} from "@/hooks/useOrganizations.js";
import { useLogout } from "@/hooks/useLogout.js";

const SidebarProfilePanel = () => {
    const [userInfo, setUserInfo] = useAtom(userInfoAtom);
    const logouts = useLogout();
    const isAuth = useAtomValue(isAuthenticatedAtom);
    const location = useLocation();
    const { data: myOrganizations, isLoading: myOrgLoading } =
        useMyOrganizations();

    // 현재 경로에 따른 활성화 상태 확인 함수
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    // 활성화된 메뉴 아이템의 스타일을 위한 클래스 생성 함수
    const getMenuItemClasses = (path) => {
        const isActiveMenu = isActive(path);
        return `flex items-center gap-3 p-3 rounded-xl transition-colors ${
            isActiveMenu 
            ? 'bg-navy-50 dark:bg-navy-800' 
            : 'hover:bg-gray-100 dark:hover:bg-navy-600'
        }`;
    };

    // 아이콘 컨테이너의 스타일을 위한 클래스 생성 함수
    const getIconContainerClasses = (path) => {
        const isActiveMenu = isActive(path);
        return `w-9 h-9 rounded-lg flex items-center justify-center ${
            isActiveMenu
            ? 'bg-navy-600 text-white dark:bg-navy-500'
            : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-navy-300'
        }`;
    };

    // 텍스트 스타일을 위한 클래스 생성 함수
    const getTextClasses = (path) => {
        const isActiveMenu = isActive(path);
        return `font-medium ${
            isActiveMenu
            ? 'text-navy-600 dark:text-white'
            : 'dark:text-white'
        }`;
    };

    const handleLogout = (e) => {
        e.preventDefault();
        logouts.mutate();
    };

    return (
        <div className="h-full flex flex-col">
            {/* 상단 프로필 영역 */}
            <div className="bg-navy-700 dark:bg-navy-800 p-6 text-white relative overflow-hidden">
                {/* 배경 패턴 효과 */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-20 translate-y-20"></div>
                    <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {isAuth ? (
                    <>
                {/* 프로필 정보 */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-white/50">
                        <AvatarImage src={userInfo?.image || "/placeholder.svg"} alt={userInfo?.name} />
                        <AvatarFallback
                            className="text-white text-[22px]"
                            style={{
                                backgroundColor: userInfo?.image
                                    ? "none"
                                    : userInfo.backgroundColor
                                        ? userInfo.backgroundColor
                                        : "#FFC107",
                            }}
                        >
                            {userInfo?.nickname?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-lg text-black">{userInfo?.nickname}</h3>
                        <p className="text-sm text-black">{userInfo?.email}</p>
                    </div>
                </div>
                    </>
                ) : (
                <div className="flex flex-col items-center mt-2">
                    <div className="w-16 h-16 bg-white rounded-full mb-2"></div>
                    <div className="text-center mb-2">
                        <p className="text-white font-medium">로그인이 필요합니다</p>
                        <p className="text-white/80 text-sm">서비스를 이용하려면 로그인해주세요</p>
                    </div>

                    {/* Stats row */}
                    {/*<div className="flex justify-between w-full text-center mt-1">*/}
                    {/*    <div className="flex-1 flex flex-col items-center">*/}
                    {/*        <span className="text-white font-medium">-</span>*/}
                    {/*        <span className="text-white/80 text-xs">기관</span>*/}
                    {/*    </div>*/}
                    {/*    <div className="flex-1 flex flex-col items-center">*/}
                    {/*        <span className="text-white font-medium">-</span>*/}
                    {/*        <span className="text-white/80 text-xs">게시글</span>*/}
                    {/*    </div>*/}
                    {/*    <div className="flex-1 flex flex-col items-center">*/}
                    {/*        <span className="text-white font-medium">-</span>*/}
                    {/*        <span className="text-white/80 text-xs">댓글</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            )}

                {/* 간단한 통계 */}
                {/*<div className="flex justify-between items-center">*/}
                {/*    <div className="text-center">*/}
                {/*        <p className="font-bold">{myOrganizations?.length}</p>*/}
                {/*        <p className="text-xs text-white/80">기관</p>*/}
                {/*    </div>*/}
                {/*    <div className="text-center">*/}
                {/*        <p className="font-bold">12</p>*/}
                {/*        <p className="text-xs text-white/80">게시글</p>*/}
                {/*    </div>*/}
                {/*    <div className="text-center">*/}
                {/*        <p className="font-bold">45</p>*/}
                {/*        <p className="text-xs text-white/80">댓글</p>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
            {!isAuth && (
            <div className="flex gap-2 px-4 py-3 border-b">
                <SheetClose asChild>
                <Link
                    to="/login"
                    className="flex-1 bg-navy-600 text-white hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600 py-2 px-3 rounded-md text-center text-sm font-medium"
                >
                    로그인
                </Link>
                </SheetClose>

                <SheetClose asChild>
                <Link
                    to="/signup"
                    className="flex-1 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-navy-700 border border-navy-700 py-2 px-3 rounded-md text-center text-sm font-medium"
                >
                    회원가입
                </Link>
                </SheetClose>
            </div>
            )}

            {/* 내 기관 목록 */}
            <div className="flex-1 overflow-auto p-4">
                {isAuth && (
                    <>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                    내가 가입한 기관
                </h4>

                {/* 기관 카드 리스트 */}
                <div className="space-y-2 mb-6 flex flex-col gap-1">
                    {myOrgLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
                        </div>
                    ) :
                    myOrganizations && myOrganizations.length > 0 ? (
                    (myOrganizations.map((org) => (
                        <SheetClose asChild>
                            <Link to={`/organization/${org.id}`} key={org.id}>
                                <div className="bg-white dark:bg-navy-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-navy-600">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-navy-600 flex items-center justify-center">
                                            {org.logo ? (
                                                <img
                                                    src={org.logo}
                                                    alt={org.name}
                                                    width={80}
                                                    height={80}
                                                    className="max-h-full object-contain rounded-lg"
                                                />
                                            ) : (
                                                <Building2 className="h-16 w-16 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium dark:text-white">{org.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{org.description}</p>
                                        </div>
                                        {/*<Badge className="bg-red-500 text-white">3</Badge>*/}
                                    </div>
                                </div>
                            </Link>
                        </SheetClose>
                    )))
                ) : (
                        <div className="text-center p-3 text-gray-500 dark:text-gray-400">
                            가입한 기관이 없습니다.
                        </div>
                )}
                </div>
                    </>
                )}

                {/* 전체 보기 버튼 */}
                {/*<SheetClose asChild>*/}
                {/*    <Link to="/organizations" className="w-full">*/}
                {/*        <Button*/}
                {/*            variant="outline"*/}
                {/*            size="sm"*/}
                {/*            className="w-full flex items-center justify-between rounded-xl h-12 mb-6"*/}
                {/*        >*/}
                {/*            <span>기관 목록 페이지로 이동</span>*/}
                {/*            <ChevronRight className="h-4 w-4" />*/}
                {/*        </Button>*/}
                {/*    </Link>*/}
                {/*</SheetClose>*/}

                {/* 메뉴 */}
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                    메뉴
                </h4>
                <nav className="space-y-1">
                    <SheetClose asChild>
                    <Link
                        to="/"
                        className={getMenuItemClasses('/')}
                    >
                        <div className={getIconContainerClasses('/')}>
                            <Home className="h-5 w-5" />
                        </div>
                        <span className={getTextClasses('/')}>홈</span>
                    </Link>
                    </SheetClose>

                    <SheetClose asChild>
                        <Link
                            to="/chat"
                            className={getMenuItemClasses('/chat')}
                        >
                            <div className={getIconContainerClasses('/chat')}>
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <span className={getTextClasses('/chat')}>채팅</span>
                        </Link>
                    </SheetClose>

                    <SheetClose asChild>
                        <Link
                            to="/community"
                            className={getMenuItemClasses('/community')}
                        >
                            <div className={getIconContainerClasses('/community')}>
                                <Users className="h-5 w-5" />
                            </div>
                            <span className={getTextClasses('/community')}>커뮤니티</span>
                        </Link>
                    </SheetClose>

                    <SheetClose asChild>
                    <a
                        href="https://flow.jakdanglabs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-600 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-gray-600 dark:text-navy-300">
                            <ExternalLink className="h-5 w-5" />
                        </div>
                        <span className="font-medium dark:text-white">팀플로우</span>
                    </a>
                    </SheetClose>

                    <SheetClose asChild>
                    <Link
                        to="/organizations"
                        className={getMenuItemClasses('/organizations')}
                    >
                        <div className={getIconContainerClasses('/organizations')}>
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className={getTextClasses('/organizations')}>기관</span>
                    </Link>
                    </SheetClose>

                    {isAuth && (
                        <>
                        <SheetClose asChild>
                            <Link
                                to="/my"
                                className={getMenuItemClasses('/my')}
                            >
                                <div className={getIconContainerClasses('/my')}>
                                    <User className="h-5 w-5" />
                                </div>
                                <span className={getTextClasses('/my')}>마이페이지</span>
                            </Link>
                        </SheetClose>
                        <SheetClose asChild>
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-navy-700">
                                <Button
                                    className="w-full flex items-center gap-2 py-2 px-3 text-sm bg-gray-100 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>로그아웃</span>
                                </Button>
                            </div>
                        </SheetClose>
                        </>
                    )}
                </nav>
            </div>

            {/*/!* 하단 버전 정보 *!/*/}
            {/*<div className="p-4 border-t border-gray-200 dark:border-navy-700">*/}
            {/*    <p className="text-xs text-center text-gray-500 dark:text-gray-400">작당 v1.0.0</p>*/}
            {/*</div>*/}
        </div>
    );
};

export default SidebarProfilePanel;
