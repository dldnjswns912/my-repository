"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useAxiosQuery } from "@/hooks/useAxiosQuery.js";
import { useChatService } from "@/hooks/useChatService";
import { useDebounce } from "@/hooks/useDebounce";
import { useDiscordService } from "@/hooks/useDiscordService.js";
import { userInfoAtom } from "@/jotai/authAtoms";
import {
  activeCategoryAtom,
  activeChannelAtom,
  activeChatRoomAtom,
  activeServerAtom,
  chatRoomsAtom,
  serversAtom,
} from "@/jotai/chatAtoms";
import { RoomType } from "@/utils/constant/constants";
import { useAtom, useAtomValue } from "jotai";
import {
  MessageCircle,
  MessageCircleQuestion,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function FriendsList() {
  const [height, setHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 180);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const userInfo = useAtomValue(userInfoAtom);
  const { getAxiosWithToken, useGet, fetchGet, fetchPost } = useAxiosQuery();
  const [servers] = useAtom(serversAtom);
  const [__, setChatRooms] = useAtom(chatRoomsAtom);
  const chatRoomLists = useAtomValue(chatRoomsAtom);
  const [_, setActiveRoom] = useAtom(activeChatRoomAtom);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [usersList, setUsersList] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const { selectChannel } = useDiscordService(userInfo?.userId);
  const { createRoom, inviteToRoom } = useChatService(userInfo?.userId);

  // useGet 훅 사용
  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useGet(
    ["users", page, size],
    import.meta.env.VITE_API_URL + `/user/users`,
    { page, size }
  );
  

  // 유저 데이터 처리
  useEffect(() => {
    if (usersData && userInfo) {
      // 자기 자신을 제외한 유저 목록만 표시
      const filteredUsers = usersData?.data.content.filter(
        (u) => u.id !== userInfo?.userId
      );
      setUsersList(filteredUsers);
      setTotalPages(usersData?.data.totalPages);
      setTotalUsers(usersData?.data.totalElements);

      // 즐겨찾기 수 계산
      const favCount = filteredUsers.filter((user) => user.isLike).length;
      setFavoriteCount(favCount);
    }
  }, [usersData, userInfo]);

  const handleDirectMessage = async (user) => {
    const existingRoom = chatRoomLists.find((room) => {
      return (
        room.type === "INDIVIDUAL" &&
        room.members.some((member) => member.userId === userInfo.userId) &&
        room.members.some((member) => member.userId === user.id)
      );
    });

    if (existingRoom) {
      setActiveRoom(existingRoom);
      return;
    } else {
      try {
        toast({
          title: "채팅방 생성 중...",
          description: `${
            user.nickname || user.name || "사용자"
          }님과의 대화방을 만들고 있습니다.`,
          duration: 2000,
        });

        const createRes = await createRoom(
          user?.nickname || user?.name || user?.email || "1:1채팅방",
          RoomType.INDIVIDUAL
        );
        if (createRes.id) {
          const inviteRes = await inviteToRoom(
            createRes.id,
            user.id,
            user.nickname || user.name || user.email
          );

          const updatedRooms = [...chatRoomLists];
          const roomIndex = updatedRooms.findIndex(
            (room) => room.id === inviteRes.id
          );

          if (roomIndex !== -1) {
            // 이미 존재하는 방이면 업데이트
            updatedRooms[roomIndex] = inviteRes;
          } else {
            // 새로운 방이면 추가
            updatedRooms.push(inviteRes);
          }

          setChatRooms(updatedRooms);
          setActiveRoom(inviteRes);

          toast({
            title: "채팅방이 생성되었습니다",
            description: `${
              user.nickname || user.name || "사용자"
            }님과 대화를 시작하세요.`,
            duration: 3000,
          });

          return { createRes, inviteRes };
        }
      } catch (error) {
        console.error("Error creating direct message:", error);
        toast({
          title: "채팅방 생성 실패",
          description: "채팅방을 생성하는 중 오류가 발생했습니다.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // 닉네임으로 사용자 검색 함수
  const searchUsersByNickname = useCallback(async () => {
    if (!searchQuery.trim()) {
      // 검색어가 없으면 기본 사용자 목록 로드
      refetchUsers();
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const axios = getAxiosWithToken();
      // 닉네임으로 사용자 검색 API 호출
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/user/find/nickname/${searchQuery}`
      );

      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        // 단일 사용자 결과인 경우 배열로 변환
        const userResult = Array.isArray(userData) ? userData : [userData];
        const filteredUsers = userResult.filter(
          (user) => user.id !== userInfo?.userId
        );
        setUsersList(filteredUsers);
        setTotalUsers(filteredUsers.length);
        setFavoriteCount(filteredUsers.filter((user) => user.isLike).length);
      } else {
        setUsersList([]);
        setSearchError("해당 닉네임의 사용자를 찾을 수 없습니다.");
        setTotalUsers(0);
        setFavoriteCount(0);
      }
    } catch (error) {
      setSearchError("해당 닉네임의 사용자를 찾을 수 없습니다.");
      setUsersList([]);
      setTotalUsers(0);
      setFavoriteCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, getAxiosWithToken, userInfo?.userId, refetchUsers]);

  // 즐겨찾기 추가/제거 함수
  const toggleFavorite = useCallback(
    async (user) => {
      if (!userInfo?.userId || !user.id) return;

      const newIsLikeStatus = !user.isLike;

      try {
        await fetchPost("/user/favorite", {
          userId: userInfo.userId,
          targetUserId: user.id,
          isLike: newIsLikeStatus,
        });

        // 즐겨찾기 상태 업데이트 - 로컬 상태만 변경
        setUsersList((prev) => {
          const updated = prev.map((u) =>
            u.id === user.id ? { ...u, isLike: newIsLikeStatus } : u
          );
          setFavoriteCount(updated.filter((u) => u.isLike).length);
          return updated;
        });

        // 토스트 메시지
        toast({
          title: newIsLikeStatus
            ? "즐겨찾기에 추가되었습니다."
            : "즐겨찾기에서 제거되었습니다.",
          duration: 2000,
        });
      } catch (err) {
        console.error("즐겨찾기 처리 실패:", err);
        toast({
          title: "즐겨찾기 처리 중 오류가 발생했습니다.",
          variant: "destructive",
          duration: 2000,
        });
      }
    },
    [userInfo?.userId, fetchPost]
  );

  // 디바운스된 검색어가 변경될 때 검색 실행
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchUsersByNickname();
    } else if (!searchQuery && !isUsersLoading) {
      refetchUsers();
    }
  }, [debouncedSearchQuery]);

  // 페이지 변경 시 사용자 목록 다시 조회
  useEffect(() => {
    if (!searchQuery.trim() && !isUsersLoading) {
      refetchUsers();
    }
  }, [page, size]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setSearchError("");
  };

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const initialWindowHeight = window.innerHeight;

    // 실제 뷰포트 높이 계산
    const updateHeight = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialWindowHeight - currentHeight;
      const isKeyboardOpen = heightDifference > 100;

      setIsKeyboardVisible(isKeyboardOpen);

      if (isKeyboardOpen) {
        if (isIOS) {
          // iOS에서는 visualViewport.height를 직접 사용
          const viewportHeight = window.visualViewport.height;
          setHeight(viewportHeight - 130); // 헤더(65px) + 푸터(65px) 제외
        } else {
          // 안드로이드는 이전과 동일하게 처리
          setHeight(currentHeight - 130);
        }
      } else {
        setHeight(currentHeight - 130); // 헤더(65px) + 푸터(65px) 제외
      }
    };

    updateHeight(); // 처음 실행

    // visualViewport API 사용
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }

    // 기본 resize 이벤트도 함께 사용
    window.addEventListener("resize", updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const location = useLocation(); // 현재 URL 경로 가져오기

  const filteredCommunity =
    servers?.filter((server) => server.id !== "home") || [];

  const [activeChannel, setActiveChannel] = useAtom(activeChannelAtom);
  const [activeCategory, setActiveCategory] = useAtom(activeCategoryAtom);
  const [activeServer, setActiveServer] = useAtom(activeServerAtom);

  const handleServerSelect = (serverId) => {
    if (activeServer === serverId) return; // 이미 선택된 서버는 무시
    setActiveServer(serverId);
    setActiveCategory(null);
    selectChannel(serverId);
  };

  // 사용자 카드 렌더링 함수
  const renderUserCard = (user) => (
    <div
      key={user.id}
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 mb-2"
      onClick={() => handleDirectMessage(user)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {user.image ? (
            <img
              src={user.image || "/placeholder.svg"}
              alt={user.nickname}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white`}
              style={{
                backgroundColor: user.backgroundColor
                  ? user.backgroundColor
                  : "#0284c7",
              }}
            >
              {(
                user.nickname.charAt(0) ||
                user.name.charAt(0) ||
                user.email.charAt(0)
              ).toUpperCase()}
            </div>
          )}
          {user.isLike && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-sm">
              <Star size={10} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="font-medium text-gray-800">
            {user.nickname || user.name}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full w-8 h-8 transition-all duration-200 ${
            user.isLike
              ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(user);
          }}
          title={user.isLike ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          <Star size={18} className={user.isLike ? "fill-yellow-500" : ""} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-8 h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            handleDirectMessage(user);
          }}
          title="1:1 채팅 시작하기"
        >
          <MessageCircle size={18} />
        </Button>
      </div>
    </div>
  );

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (userInfo?.userId && !window.friendsListLoaded) {
      window.friendsListLoaded = true;
      refetchUsers();
    }
  }, [userInfo?.userId]);

  return (
    <>
      {location.pathname !== "/chat" ? (
        <div
          className="flex flex-col bg-white"
          style={{
            height: `${height - 65}px`,
            position: isKeyboardVisible ? "fixed" : "relative",
            top: isKeyboardVisible ? "65px" : "auto",
            left: isKeyboardVisible ? "0" : "auto",
            right: isKeyboardVisible ? "0" : "auto",
          }}
        >
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Input
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300"
                placeholder="검색하기"
                value={searchQuery}
                onChange={handleSearch}
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-5 w-5 rounded-full p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Community count */}
          <div className="px-4 py-2 text-sm text-gray-600 font-medium">
            {searchQuery
              ? `검색 결과 - ${usersList.length}명`
              : `모든 커뮤니티 - ${filteredCommunity?.length}개`}
          </div>

          {/* Community list */}
          <div className="flex-1 overflow-auto">
            {filteredCommunity &&
              filteredCommunity.map((community) => (
                <div
                  key={community.id}
                  className={`flex items-center px-4 py-3 cursor-pointer ${
                    activeServer === community.id
                      ? "bg-[#F5F5F5]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleServerSelect(community.id)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#FFC107]">
                      {community.icon || community.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="font-medium">{community.name}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex flex-col bg-white"
            style={{
              height: `${height - 65}px`,
              position: isKeyboardVisible ? "fixed" : "relative",
              top: isKeyboardVisible ? "65px" : "auto",
              left: isKeyboardVisible ? "0" : "auto",
              right: isKeyboardVisible ? "0" : "auto",
            }}
          >
            {/* Search */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="relative">
                <Input
                  className="pl-10 pr-10 py-2 w-full rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                  placeholder="친구 닉네임으로 검색하기"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                {isSearching && (
                  <div className="absolute right-10 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6 rounded-full p-0 hover:bg-gray-100"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-2">
                친구의 닉네임을 검색하여 1:1 채팅방에 초대할 수 있습니다.
              </p>
            </div>

            {/* 검색 오류 메시지 */}
            {searchError && (
              <div className="px-4 py-2 bg-red-50">
                <p className="text-sm text-red-500 flex items-center">
                  <MessageCircleQuestion size={14} className="mr-1" />{" "}
                  {searchError}
                </p>
              </div>
            )}

            {/* 즐겨찾기 헤더 */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-800">
                  즐겨찾기
                </h2>
              </div>

              <div className="text-sm text-gray-600 font-medium mb-2 flex justify-between items-center">
                <span>
                  {searchQuery
                    ? `검색 결과 - ${totalUsers}명 (즐겨찾기 ${favoriteCount}명)`
                    : `전체 친구 - ${totalUsers}명 (즐겨찾기 ${favoriteCount}명)`}
                </span>
                {!searchQuery && totalUsers > size && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0 || isUsersLoading}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      &lt;
                    </Button>
                    <span className="text-xs text-gray-500 mx-1">
                      {page + 1} / {Math.ceil(totalUsers / size)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(
                          Math.min(Math.ceil(totalUsers / size) - 1, page + 1)
                        )
                      }
                      disabled={
                        page >= Math.ceil(totalUsers / size) - 1 ||
                        isUsersLoading
                      }
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      &gt;
                    </Button>
                  </div>
                )}
              </div>

              {/* 친구 목록 */}
              <div className="overflow-auto px-1 pb-4">
                {isUsersLoading || isSearching ? (
                  <div className="flex flex-col items-center justify-center h-40 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500">
                      친구 목록을 불러오는 중...
                    </p>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <Users size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-1 font-medium">
                        {searchQuery
                          ? "검색 결과가 없습니다."
                          : "친구 목록이 비어있습니다."}
                      </p>
                      <p className="text-sm text-gray-400">
                        {searchQuery
                          ? "다른 닉네임으로 검색해보세요."
                          : "새로운 친구를 추가하고 대화를 시작해보세요."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {usersList.map((user) => renderUserCard(user))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
