"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { userInfoAtom } from "@/jotai/authAtoms";
import { useAtomValue } from "jotai";
import { Search, Star } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useDebounce } from "@/hooks/useDebounce";

// 메모이제이션된 컴포넌트
const SearchMember = memo(({ onMemberSelect }) => {
  const [searchNickname, setSearchNickname] = useState("");
  const debouncedSearchNickname = useDebounce(searchNickname, 180);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // 즐겨찾기 유저 목록 관련 상태
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const userinfo = useAtomValue(userInfoAtom);
  const { getAxiosWithToken, useGet, fetchPost } = useAxiosQuery();

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
    if (usersData && userinfo) {
      // 자기 자신을 제외한 유저 목록만 표시
      const filteredUsers = usersData?.data.content.filter(
        (u) => u.id !== userinfo?.userId
      );
      setUsersList(filteredUsers);
      setTotalPages(usersData?.data.totalPages);
    }
  }, [usersData, userinfo]);

  // 초대 관련 함수들
  const searchUserByEmail = async () => {
    if (!searchNickname || !searchNickname.trim()) {
      setSearchError("닉네임을을 입력해주세요.");
      return;
    }

    // 자기 자신은 검색 불가
    if (userinfo?.nickname === searchNickname) {
      setSearchError("자신을 초대할 수 없습니다.");
      return;
    }

    // 이미 검색 중이면 중복 요청 방지
    if (isSearching) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const axios = getAxiosWithToken();
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/user/find/nickname/${searchNickname}`
      );

      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        const newMember = {
          id: userData.id,
          email: userData.email,
          name: userData.email.split("@")[0],
          nickname: userData.nickname || userData.email.split("@")[0],
          isLike: userData.isLike || false,
        };

        setSearchResult(newMember);
      } else {
        setSearchError("유저를 찾을 수 없습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      setSearchError("유저를 찾을 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  const addSelectedMember = () => {
    if (searchResult) {
      onMemberSelect(searchResult);
      setSearchResult(null);
      setSearchNickname("");
    }
  };

  const handleFavoriteUser = async (user) => {
    if (user) {
      console.log(userinfo)
      const newIsLikeStatus = !user.isLike;
      
      await fetchPost("/user/favorite", {
        userId: userinfo?.userId,
        targetUserId: user.id,
        isLike: newIsLikeStatus,
      });
      
      setSearchResult((prev) => ({
        ...prev,
        isLike: newIsLikeStatus,
      }));
      
      setUsersList((prev) => {
        // 좋아요 취소일 경우 목록에서 삭제
        if (!newIsLikeStatus) {
          return prev.filter(u => u.id !== user.id);
        }
        
        // 좋아요 추가인 경우
        const userExists = prev.some(u => u.id === user.id);
        if (userExists) {
          return prev.map((u) => {
            if (u.id === user.id) {
              return { ...u, isLike: true };
            }
            return u;
          });
        } else {
          return [...prev, { ...user, isLike: true }];
        }
      });
    }
    refetchUsers()
  };

  // 유저 목록에서 멤버 추가
  const addUserFromList = (user) => {
    const newMember = {
      id: user.id,
      email: user.email,
      name: user.nickname || user.name || user.email.split("@")[0],
      nickname: user.nickname || user.name || user.email.split("@")[0],
    };
    onMemberSelect(newMember);
  };

  // 디바운스된 검색어가 변경될 때 자동 검색 실행
  useEffect(() => {
    if (debouncedSearchNickname && debouncedSearchNickname.trim().length > 0) {
      searchUserByEmail();
    }
  }, [debouncedSearchNickname]);

  return (
    <div className="space-y-4">
      {/* 이메일 검색 */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="email-search" className="text-xs text-gray-500">
          닉네임으로 검색
        </label>
        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input
              id="email-search"
              value={searchNickname}
              onChange={(e) => {
                setSearchNickname(e.target.value);
                setSearchError("");
              }}
              className="pl-10 bg-[#F5F5F5] border-[#E0E0E0] text-gray-800"
              placeholder="초대할 사용자의 닉네임을 입력하세요"
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFC107]"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 검색 오류 메시지 */}
      {searchError && (
        <div className="w-full">
          <p className="text-sm text-red-500">{searchError}</p>
        </div>
      )}

      {searchResult && (
        <div className="w-full">
          <div className="border border-[#E0E0E0] rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-[#E0E0E0]">
                  <AvatarImage
                    src={
                      searchResult.avatar ||
                      "/placeholder.svg?height=40&width=40"
                    }
                    alt={searchResult.name}
                  />
                  <AvatarFallback className="bg-[#FFC107] text-white">
                    {searchResult.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-800">
                    {searchResult.nickname}
                  </p>
                </div>
              </div>
              <Button
                variant={"ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleFavoriteUser(searchResult)}
              >
                {searchResult.isLike === true ? (
                  <Star className="w-12 h-12" fill="#FFC107" />
                ) : (
                  <Star className="w-12 h-12" />
                )}
              </Button>
              <Button
                onClick={addSelectedMember}
                size="sm"
                className="bg-[#FFC107] hover:bg-[#FFB000] text-white"
              >
                추가
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 유저 목록 */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-500">즐겨찾기 유저</label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || isUsersLoading}
              className="h-6 w-6 p-0"
            >
              &lt;
            </Button>
            <span className="text-xs text-gray-500">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={
                page === totalPages - 1 || totalPages === 0 || isUsersLoading
              }
              className="h-6 w-6 p-0"
            >
              &gt;
            </Button>
          </div>
        </div>
        {isUsersLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC107]"></div>
          </div>
        ) : (
          <div className="border border-[#E0E0E0] rounded-lg overflow-hidden max-h-[120px] overflow-y-auto">
            {usersList.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                사용자가 없습니다
              </div>
            ) : (
              usersList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-[#F5F5F5] border-b border-[#E0E0E0] last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-[#E0E0E0]">
                      <AvatarImage
                        src={
                          user.avatar || "/placeholder.svg?height=40&width=40"
                        }
                        alt={user.nickname || user.name}
                      />
                      <AvatarFallback className="bg-[#FFC107] text-white">
                        {(user.nickname || user.name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.nickname || user.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => addUserFromList(user)}
                    size="sm"
                    className="bg-[#FFC107] hover:bg-[#FFB000] text-white"
                  >
                    추가
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SearchMember.displayName = "SearchMember";

export default SearchMember;
