// src/components/chat/CreateChatModal.jsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import useChat from '@/hooks/useChatHooks';
import { useAxios } from '@/hooks/useAxios';
import {
  availableMembersAtom,
  isCreateChatOpenAtom,
  isCreateGroupChatOpenAtom,
  memberIdAtom,
  newChatNameAtom,
  selectChatRoomAtom,
  selectedMembersAtom
} from '@/jotai/chatAtoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

export const CreateChatModal = () => {
  const [isCreateChatOpen, setIsCreateChatOpen] = useAtom(isCreateChatOpenAtom);
  const [isCreateGroupChatOpen, setIsCreateGroupChatOpen] = useAtom(isCreateGroupChatOpenAtom);
  const [newChatName, setNewChatName] = useAtom(newChatNameAtom);
  const [selectedMembers, setSelectedMembers] = useAtom(selectedMembersAtom);
  const [availableMembers, setAvailableMembers] = useAtom(availableMembersAtom);
  const memberId = useAtomValue(memberIdAtom);
  const selectChatRoom = useSetAtom(selectChatRoomAtom);
  
  // 이메일 검색 관련 상태
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  
  const { fetchAvailableMembers, createChatRoom } = useChat();
  const { getAxiosWithToken } = useAxios();
  
  useEffect(() => {
    if (isCreateChatOpen || isCreateGroupChatOpen) {
      loadAvailableMembers();
    }
  }, [isCreateChatOpen, isCreateGroupChatOpen]);
  
  const loadAvailableMembers = async () => {
    const members = await fetchAvailableMembers();
    setAvailableMembers(members);
  };
  
  const handleCloseChatModal = () => {
    setIsCreateChatOpen(false);
    resetForm();
  };
  
  const handleCloseGroupChatModal = () => {
    setIsCreateGroupChatOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setNewChatName('');
    setSelectedMembers([]);
    setSearchEmail('');
    setSearchError('');
    setSearchResult(null);
  };
  
  const removeMember = (memberId) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== memberId));
  };
  
  // 일반 채팅방 이메일 검색
  const searchUserByEmail = async () => {
    if (!searchEmail || !searchEmail.trim()) {
      setSearchError("이메일을 입력해주세요.");
      return;
    }

    if (!searchEmail.includes('@')) {
      setSearchError("유효한 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const axios = getAxiosWithToken();
      const response = await axios.get(import.meta.env.VITE_API_URL + `/user/find/${searchEmail}`);
      
      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        const newMember = {
          id: userData.id,
          email: userData.email,
          name: userData.email.split('@')[0],
          avatar: null
        };
        
        setSearchResult(newMember);
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      setSearchError("유저를 찾을 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };
  
  // 그룹 채팅용 이메일 검색 함수
  const searchUserForGroupChat = async () => {
    if (!searchEmail || !searchEmail.trim()) {
      setSearchError("이메일을 입력해주세요.");
      return;
    }

    if (!searchEmail.includes('@')) {
      setSearchError("유효한 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const axios = getAxiosWithToken();
      const response = await axios.get(import.meta.env.VITE_API_URL + `/user/find/${searchEmail}`);
      
      if (response.data.resultCode === 200) {
        const userData = response.data.data;
        
        const newMember = {
          id: userData.id,
          email: userData.email,
          name: userData.email.split('@')[0],
          avatar: null
        };
        
        if (selectedMembers.some(member => member.id === userData.id)) {
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
  
  // 검색 결과로 채팅방 생성
  const createChatWithSearchResult = async () => {
    if (!searchResult) return;
    
    const chatRoomId = await createChatRoom([searchResult]);
    if (chatRoomId) {
      handleCloseChatModal();
      selectChatRoom(chatRoomId);
    }
  };
  
  // 그룹 채팅에 검색 결과 추가
  const addSearchedUserToGroup = () => {
    if (searchResult) {
      setSelectedMembers(prev => [...prev, searchResult]);
      setSearchResult(null);
      setSearchEmail("");
    }
  };
  
  const handleCreateGroupChat = async () => {
    if (!newChatName.trim() || selectedMembers.length === 0) return;
    
    // 그룹 채팅방 생성
    const chatRoomId = await createChatRoom(selectedMembers, true);
    if (chatRoomId) {
      handleCloseGroupChatModal();
      selectChatRoom(chatRoomId);
    }
  };
  
  return (
    <>
      {/* 1:1 채팅방 생성 모달 */}
      <Modal isOpen={isCreateChatOpen} onClose={handleCloseChatModal} className="sm:max-w-[425px]">
        <ModalHeader>
          <ModalTitle>새 채팅</ModalTitle>
          <ModalDescription>이메일로 사용자를 검색하여 1:1 채팅방을 생성합니다.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email-search-chat" className="text-right">
                이메일
              </label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="email-search-chat"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setSearchError("");
                    setSearchResult(null);
                  }}
                  className="flex-1"
                  placeholder="사용자 이메일을 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && searchUserByEmail()}
                />
                <Button 
                  onClick={searchUserByEmail} 
                  disabled={isSearching || !searchEmail.trim()}
                  size="sm"
                >
                  {isSearching ? "검색 중..." : "검색"}
                </Button>
              </div>
            </div>
            
            {searchError && (
              <div className="ml-[120px]">
                <p className="text-sm text-red-500">{searchError}</p>
              </div>
            )}
            
            {/* 검색 결과 표시 */}
            {searchResult && (
              <div className="ml-[120px] mb-2">
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={searchResult.avatar || "/placeholder.svg?height=40&width=40"} alt={searchResult.name} />
                        <AvatarFallback>{searchResult.name ? searchResult.name[0] : "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{searchResult.name}</p>
                        <p className="text-sm text-gray-500">{searchResult.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={createChatWithSearchResult}
                      size="sm"
                    >
                      채팅하기
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleCloseChatModal}>
            취소
          </Button>
          <Button 
            onClick={searchUserByEmail} 
            disabled={isSearching || !searchEmail.trim()}
          >
            {isSearching ? "검색 중..." : "검색"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* 그룹 채팅방 생성 모달 */}
      <Modal isOpen={isCreateGroupChatOpen} onClose={handleCloseGroupChatModal} className="sm:max-w-[425px]">
        <ModalHeader>
          <ModalTitle>새 단톡방</ModalTitle>
          <ModalDescription>여러 사람과 함께하는 그룹 채팅방을 생성합니다.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="group-name" className="text-right">
                단톡방 이름
              </label>
              <Input
                id="group-name"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="col-span-3"
                placeholder="단톡방 이름을 입력하세요"
              />
            </div>
            
            {/* 이메일로 유저 검색 UI 추가 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email-search-group" className="text-right">
                이메일 검색
              </label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="email-search-group"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setSearchError("");
                  }}
                  className="flex-1"
                  placeholder="이메일을 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && searchUserForGroupChat()}
                />
                <Button 
                  onClick={searchUserForGroupChat} 
                  disabled={isSearching || !searchEmail.trim()}
                  size="sm"
                >
                  {isSearching ? "검색 중..." : "검색"}
                </Button>
              </div>
            </div>
            
            {/* 검색 에러 메시지 표시 */}
            {searchError && (
              <div className="ml-[120px]">
                <p className="text-sm text-red-500">{searchError}</p>
              </div>
            )}
            
            {/* 검색 결과 표시 */}
            {searchResult && (
              <div className="ml-[120px] mb-2">
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={searchResult.avatar || "/placeholder.svg?height=40&width=40"} alt={searchResult.name} />
                        <AvatarFallback>{searchResult.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{searchResult.name}</p>
                        <p className="text-sm text-gray-500">{searchResult.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={addSearchedUserToGroup}
                      size="sm"
                    >
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right pt-2">선택된 멤버</label>
              <div className="col-span-3 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                {selectedMembers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">선택된 멤버가 없습니다.</p>
                ) : (
                  selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-md mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar || "/placeholder.svg?height=40&width=40"} alt={member.name} />
                          <AvatarFallback>{member.name ? member.name[0] : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => removeMember(member.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {selectedMembers.length > 0 && (
              <div className="mt-1">
                <p className="text-sm text-gray-500 text-right">{selectedMembers.length}명 선택됨</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleCloseGroupChatModal}>
            취소
          </Button>
          <Button 
            onClick={handleCreateGroupChat} 
            disabled={!newChatName.trim() || selectedMembers.length === 0}
          >
            생성
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CreateChatModal