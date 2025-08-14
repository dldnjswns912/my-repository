"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  isCreateGroupChatOpenAtom,
  newChatNameAtom,
  selectedMembersAtom,
} from "@/jotai/chatAtoms";
import { useAxios } from "@/hooks/useAxios";
import { useAtom } from "jotai";
import { useState } from "react";

const CreateGroupChatDialog = ({ onCreateGroupChat, availableUsers }) => {
  const [isCreateGroupChatOpen, setIsCreateGroupChatOpen] = useAtom(
    isCreateGroupChatOpenAtom
  );
  const [newChatName, setNewChatName] = useAtom(newChatNameAtom);
  const [selectedMembers, setSelectedMembers] = useAtom(selectedMembersAtom);
  const { getAxiosWithToken } = useAxios();

  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const safeCloseDialog = () => {
    try {
      setIsCreateGroupChatOpen(false);
      setNewChatName("");
      setSelectedMembers([]);
      setSearchEmail("");
      setSearchError("");
      setSearchResult(null);
    } catch (error) {
      console.error("다이얼로그 닫기 오류:", error);
    }
  };

  const removeMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.filter((member) => member.id !== memberId)
    );
  };

  const handleCreate = () => {
    if (!newChatName.trim() || selectedMembers.length === 0) return;
    onCreateGroupChat();
  };

  const searchUserByEmail = async () => {
    if (!searchEmail || !searchEmail.trim()) {
      setSearchError("이메일을 입력해주세요.");
      return;
    }

    if (!searchEmail.includes("@")) {
      setSearchError("유효한 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const axios = getAxiosWithToken();
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/user/find/${searchEmail}`
      );

      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        const newMember = {
          id: userData.id,
          email: userData.email,
          name: userData.email.split("@")[0],
          avatar: null,
        };

        if (selectedMembers.some((member) => member.id === userData.id)) {
          setSearchError("이미 선택된 사용자입니다.");
        } else {
          setSearchResult(newMember);
        }
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      setSearchError("유저를 찾을 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  const addSearchedUser = () => {
    if (searchResult) {
      setSelectedMembers((prev) => [...prev, searchResult]);
      setSearchResult(null);
      setSearchEmail("");
    }
  };

  return (
    <Dialog
      open={isCreateGroupChatOpen}
      onOpenChange={(open) => {
        if (!open) safeCloseDialog();
      }}
    >
      <DialogContent className="w-full max-w-[480px] rounded-xl shadow-modal p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
            새 단톡방
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-2">
          {/* 단톡방 이름 입력 필드 */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="group-name"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              단톡방 이름
            </label>
            <Input
              id="group-name"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="w-full rounded-lg"
              placeholder="단톡방 이름을 입력하세요"
            />
          </div>

          {/* 이메일 검색 영역 */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="email-search"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              이메일 검색
            </label>
            <div className="flex w-full gap-2">
              <Input
                id="email-search"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 rounded-lg"
                placeholder="이메일을 입력하세요"
                onKeyPress={(e) => e.key === "Enter" && searchUserByEmail()}
              />
              <Button
                onClick={searchUserByEmail}
                disabled={isSearching || !searchEmail.trim()}
                className="bg-chat-primary hover:bg-chat-primary/90 text-white rounded-lg shrink-0"
              >
                {isSearching ? "검색 중..." : "검색"}
              </Button>
            </div>
          </div>

          {/* 검색 오류 메시지 */}
          {searchError && (
            <div className="w-full">
              <p className="text-sm text-red-500">{searchError}</p>
            </div>
          )}

          {/* 검색 결과 영역 */}
          {searchResult && (
            <div className="w-full">
              <div className="border border-gray-200 dark:border-navy-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border dark:border-navy-600">
                      <AvatarImage
                        src={searchResult.avatar}
                        alt={searchResult.name}
                      />
                      <AvatarFallback className="bg-chat-primary text-white">
                        {searchResult.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {searchResult.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchResult.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={addSearchedUser}
                    size="sm"
                    className="rounded-lg bg-chat-primary hover:bg-chat-primary/90 text-white"
                  >
                    추가
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 선택된 멤버 영역 */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">
              선택된 멤버
            </label>
            <div className="w-full border border-gray-200 dark:border-navy-600 rounded-xl p-2 max-h-[200px] overflow-y-auto">
              {selectedMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-4 dark:text-gray-400">
                  선택된 멤버가 없습니다
                </p>
              ) : (
                selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-chat-hover dark:hover:bg-navy-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border dark:border-navy-600">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-chat-primary text-white">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-200">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      ×
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="w-full text-right">
              <span className="text-sm text-chat-primary dark:text-chat-accent font-medium">
                {selectedMembers.length}명 선택됨
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={safeCloseDialog}
            className="rounded-full border-gray-300 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700"
          >
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!newChatName.trim() || selectedMembers.length === 0}
            className="rounded-full bg-chat-primary hover:bg-chat-primary/90 text-white"
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupChatDialog;
