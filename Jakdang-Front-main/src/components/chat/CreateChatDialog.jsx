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
import { isCreateChatOpenAtom, newChatNameAtom, selectedMembersAtom } from "@/jotai/chatAtoms";
import { useAxios } from "@/hooks/useAxios";
import { useAtom } from "jotai";
import { useState } from "react";

const CreateChatDialog = ({ onCreateChat }) => {
  const [isCreateChatOpen, setIsCreateChatOpen] = useAtom(isCreateChatOpenAtom);
  const [newChatName, setNewChatName] = useAtom(newChatNameAtom);
  const [selectedMembers, setSelectedMembers] = useAtom(selectedMembersAtom);
  const { getAxiosWithToken } = useAxios();

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const safeCloseDialog = () => {
    try {
      setIsCreateChatOpen(false);
      setNewChatName("");
      setSearchError("");
      setSearchResult(null);
    } catch (error) {
      console.error("다이얼로그 닫기 오류:", error);
    }
  };

  const handleCreate = () => {
    if (!newChatName.trim()) return;
    onCreateChat();
  };

  const searchUserByEmail = async () => {
    if (!newChatName || !newChatName.trim()) {
      setSearchError("이메일을 입력해주세요.");
      return;
    }

    if (!newChatName.includes("@")) {
      setSearchError("유효한 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const axios = getAxiosWithToken();
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/user/find/${newChatName}`
      );

      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        const newMember = {
          id: userData.id,
          email: userData.email,
          name: userData.email.split("@")[0],
          avatar: null,
        };

        setSearchResult(newMember);
        console.log("newMember 1>>>", newMember);
        setSelectedMembers( (prev) => [...prev, newMember] );
        console.log("newMember 2>>>", newMember);
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      setSearchError("유저를 찾을 수 없습니다. 다시 시도해주세요.");
      
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog
      open={isCreateChatOpen}
      onOpenChange={(open) => {
        if (!open) safeCloseDialog();
      }}
    >
      <DialogContent className="sm:max-w-[425px] rounded-xl shadow-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
            새 채팅
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="email"
              className="text-right text-gray-600 dark:text-gray-300"
            >
              이메일
            </label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="email"
                value={newChatName}
                onChange={(e) => {
                  setNewChatName(e.target.value);
                  setSearchError("");
                  setSearchResult(null);
                }}
                className="flex-1 rounded-lg border-gray-200 dark:border-navy-600 focus:border-chat-primary focus:ring-chat-primary"
                placeholder="채팅할 상대의 이메일을 입력하세요"
                onKeyPress={(e) => e.key === "Enter" && searchUserByEmail()}
              />
              <Button
                onClick={searchUserByEmail}
                a
                disabled={isSearching || !newChatName.trim()}
                className="bg-chat-primary hover:bg-chat-primary/90 text-white rounded-lg"
              >
                {isSearching ? "검색 중..." : "검색"}
              </Button>
            </div>
          </div>

          {searchError && (
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-3">
                <p className="text-sm text-red-500">{searchError}</p>
              </div>
            </div>
          )}

          {searchResult && (
            <div className="grid grid-cols-4 items-start">
              <div className="col-span-1"></div>
              <div className="col-span-3">
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={safeCloseDialog}
            className="rounded-full border-gray-300 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700"
          >
            취소
          </Button>
          <Button
            onClick={handleCreate}
            className="rounded-full bg-chat-primary hover:bg-chat-primary/90 text-white"
            disabled={!searchResult}
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatDialog;
