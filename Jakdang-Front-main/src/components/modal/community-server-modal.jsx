"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent2,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyTimezoneWithPattern } from "@/utils/formatDate";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useFileApi } from "@/service/api/fileApi";

/**
 * 커뮤니티(서버) 생성/가입 모달 컴포넌트
 * @param {boolean} open - 모달 열림 상태
 * @param {function} onOpenChange - 모달 열림/닫힘 핸들러
 * @param {string} activeTab - 'create' 또는 'join'
 * @param {function} setActiveTab - 탭 변경 핸들러
 * @param {function} onCreate - 커뮤니티 생성 액션
 * @param {function} onJoin - 커뮤니티 가입 액션
 * @param {boolean} loading - 액션 로딩 상태
 * @param {array} servers - 현재 가입된 서버 목록
 */
export default function CommunityServerModal({
  open,
  onOpenChange,
  activeTab,
  setActiveTab,
  onCreate,
  onJoin,
  loading = false,
  servers = [],
}) {
  // 내부 입력 상태
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedServerId, setSelectedServerId] = useState("");
  const [selectedServerName, setSelectedServerName] = useState("");
  const [availableServers, setAvailableServers] = useState([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 추가
  const [serverImage, setServerImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();
  const { uploadLargeFile } = useFileApi();
  const { fetchGet } = useAxiosQuery();

  // 가입 가능한 서버 목록 가져오기
  useEffect(() => {
    if (open && activeTab === "join") {
      const fetchAvailableServers = async () => {
        setIsLoadingServers(true);
        try {
          const response = await fetchGet(`/chat/discord/channel/all`);
          if (response && response.resultCode === 200) {
            console.log("채널 목록:", response);
            setAvailableServers(response.data || []);
          }
        } catch (error) {
          console.error("채널 목록 가져오기 실패:", error);
          setAvailableServers([]);
        } finally {
          setIsLoadingServers(false);
        }
      };
      fetchAvailableServers();
    }
  }, [open, activeTab]);

  // 탭 변경시에만 입력값 초기화
  useEffect(() => {
    setNewName("");
    setNewDesc("");
    setSelectedServerId("");
    setSelectedServerName("");
    setSearchTerm(""); // 탭 변경 시 검색어 초기화
  }, [activeTab]);

  // 모달이 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!open) {
      setNewName("");
      setNewDesc("");
      setSelectedServerId("");
      setSelectedServerName("");
      setSearchTerm(""); // 모달 닫힐 시 검색어 초기화
      setServerImage("");
      setSelectedFile(null);
    }
  }, [open]);

  // 검색어에 따라 필터링된 서버 목록
  const filteredServers = availableServers.filter((server) =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: "이미지 선택 실패",
          description: "선택된 파일이 없습니다.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "10MB 이하의 이미지만 업로드 가능합니다.",
          variant: "destructive",
        });
        return;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        setServerImage(previewUrl);
        setSelectedFile(file);

        toast({
          title: "이미지 선택 완료",
          description: "커뮤니티 생성 시 이미지가 함께 업로드됩니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("이미지 미리보기 생성 오류:", error);
        toast({
          title: "이미지 처리 오류",
          description: "이미지를 처리하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };

    input.click();
  };

  useEffect(() => {
    return () => {
      if (selectedFile && serverImage.startsWith("blob:")) {
        URL.revokeObjectURL(serverImage);
      }
    };
  }, [selectedFile, serverImage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent2 className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {activeTab === "create"
              ? "새 커뮤니티 만들기"
              : "커뮤니티 가입하기"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "create"
                ? "border-b-2 border-[#FFC107] text-[#FFC107]"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("create")}
          >
            만들기
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "join"
                ? "border-b-2 border-[#FFC107] text-[#FFC107]"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("join")}
          >
            가입하기
          </button>
        </div>
        {activeTab === "create" ? (
          <>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-gray-200">
                  <AvatarImage
                    src={serverImage || "/placeholder.svg"}
                    alt="커뮤니티 이미지"
                    onError={(e) => {
                      console.log("이미지 로드 실패:", e);
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <AvatarFallback
                    className="text-white text-[40px]"
                    style={{
                      backgroundColor: "#FFC107",
                    }}
                  >
                    {newName ? newName.charAt(0).toUpperCase() : "C"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#FFC107] hover:bg-[#FFB300]"
                  onClick={handleImageUpload}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">커뮤니티 이미지 추가</div>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  이름
                </Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                  placeholder="커뮤니티 이름"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  설명
                </Label>
                <Input
                  id="description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="col-span-3"
                  placeholder="설명 (선택)"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-4 py-4">
            {/* 선택된 커뮤니티 이름 표시 부분은 유지 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="server-name" className="text-right">
                선택된 커뮤니티
              </Label>
              <Input
                id="server-name"
                value={selectedServerName}
                disabled
                className="col-span-3"
                placeholder="아래 목록에서 선택하세요"
              />
            </div>

            {/* 검색 입력 필드 추가 */}
            <div className="mt-2">
              <Label htmlFor="search-server" className="sr-only">
                커뮤니티 검색
              </Label>
              <Input
                id="search-server"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="커뮤니티 이름 검색..."
                className="w-full"
              />
            </div>

            <div className="mt-2">
              <Label className="mb-2 block">가입 가능한 커뮤니티</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {isLoadingServers ? (
                  <div className="text-center py-4 text-gray-400">
                    커뮤니티 목록을 불러오는 중...
                  </div>
                ) : filteredServers.length > 0 ? ( // 필터링된 목록 사용
                  filteredServers.map((server) => {
                    const isAlreadyJoined = servers.some(
                      (s) => s.id === server.id
                    );

                    return (
                      <div
                        key={server.id}
                        className={`p-3 ${
                          !isAlreadyJoined
                            ? "hover:bg-[#F5F5F5] cursor-pointer"
                            : "bg-gray-100 cursor-not-allowed opacity-60" // 이미 가입된 경우 스타일 변경
                        } rounded-md mb-2 border-b last:border-b-0 ${
                          selectedServerId === server.id ? "bg-[#FFF8E1]" : "" // 선택된 항목 강조
                        }`}
                        onClick={() => {
                          if (!isAlreadyJoined) {
                            setSelectedServerName(server.name);
                            setSelectedServerId(server.id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{server.name}</div>
                          {isAlreadyJoined && (
                            <span className="text-xs bg-[#FFC107] text-white px-2 py-0.5 rounded-full">
                              이미 가입됨
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {server.description}
                        </div>
                        {server.createdAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            생성일:{" "}
                            {applyTimezoneWithPattern(server.createdAt, 2)}
                          </div>
                        )}
                        {server.channelCategories &&
                          server.channelCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {server.channelCategories.map((category) => (
                                <span
                                  key={category.id}
                                  className="text-xs bg-[#F0F0F0] px-2 py-0.5 rounded-full"
                                >
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    );
                  })
                ) : searchTerm && availableServers.length > 0 ? ( // 검색 결과 없을 때
                  <div className="text-center py-4 text-gray-400">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  // 가입 가능한 커뮤니티 자체가 없을 때
                  <div className="text-center py-4 text-gray-400">
                    가입 가능한 커뮤니티가 없습니다.
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          {activeTab === "create" ? (
            <Button
              onClick={async () => {
                if (!newName.trim()) return;

                try {
                  let imageUrl = "";
                  let id = "";
                  if (selectedFile) {
                    try {
                      // message-input 컴포넌트의 파일 업로드 로직 참고
                      const uploadResult = await uploadLargeFile(selectedFile);

                      if (
                        uploadResult &&
                        uploadResult.response &&
                        uploadResult.response.data
                      ) {
                        const fileData = uploadResult.response.data;
                        imageUrl = fileData.address || "";
                        id = fileData.id || "";
                        console.log("업로드된 파일 데이터:", fileData);
                        console.log("업로드된 파일 URL:", imageUrl);
                        console.log("업로드된 파일 ID:", fileId);
                        toast({
                          title: "이미지 업로드 성공",
                          description:
                            "커뮤니티 이미지가 성공적으로 업로드되었습니다.",
                          variant: "success",
                        });
                      } else {
                        toast({
                          title: "이미지 업로드 실패",
                          description: "이미지 업로드에 실패했습니다.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("이미지 업로드 오류:", error);
                      toast({
                        title: "이미지 업로드 오류",
                        description: "이미지 업로드 중 오류가 발생했습니다.",
                        variant: "destructive",
                      });
                    }
                  }

                  onCreate && onCreate(newName, newDesc, { imageUrl, id });
                } catch (error) {
                  console.error("커뮤니티 생성 오류:", error);
                  toast({
                    title: "커뮤니티 생성 실패",
                    description: "커뮤니티 생성 중 오류가 발생했습니다.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={loading || !newName.trim()}
              className="bg-[#FFC107] text-white hover:bg-[#FFB300]" // 호버 효과 추가
            >
              {loading ? "처리 중..." : "만들기"}
            </Button>
          ) : (
            <Button
              onClick={() => onJoin && onJoin(selectedServerId)}
              disabled={
                loading ||
                !selectedServerId ||
                servers.some((server) => server.id === selectedServerId)
              }
              className="bg-[#FFC107] text-white hover:bg-[#FFB300] disabled:bg-gray-400 disabled:cursor-not-allowed" // 비활성화 스타일 및 호버 효과 추가
            >
              {loading
                ? "처리 중..."
                : servers.some((server) => server.id === selectedServerId)
                ? "이미 가입됨"
                : "가입"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent2>
    </Dialog>
  );
}
