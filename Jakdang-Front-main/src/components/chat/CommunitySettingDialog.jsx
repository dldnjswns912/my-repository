"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent2,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "../toast-provider";
import { useFileApi } from "@/service/api/fileApi";
import { useAtomValue } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";

const CommunitySettingDialog = ({
  handleLeave,
  communityData,
  updateChannel,
}) => {
  const [activeTab, setActiveTab] = useState("settings");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [communityImage, setCommunityImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { uploadLargeFile } = useFileApi();
  const [isModified, setIsModified] = useState(false);
  const userInfo = useAtomValue(userInfoAtom);

  // 사용자가 관리자인지 확인
  const isAdmin =
    communityData && userInfo && communityData.adminId === userInfo.userId;

  console.log("커뮤니티 데이터:", communityData);

  // 관리자가 아닌 경우 기본 탭을 나가기로 설정
  useEffect(() => {
    if (!isAdmin) {
      setActiveTab("leave");
    }
  }, [isAdmin]);

  // 커뮤니티 데이터가 변경될 때 상태 초기화
  useEffect(() => {
    if (communityData) {
      setName(communityData.name || "");
      setDescription(communityData.description || "");
      setCommunityImage(communityData.imageRequest?.imageUrl || "");
      setIsModified(false);
    }
  }, [communityData]);

  // 모달이 닫힐 때 입력값 초기화
  const handleDialogChange = (open) => {
    if (!open) {
      // 관리자일 경우에만 설정 탭으로 초기화
      setActiveTab(isAdmin ? "settings" : "leave");
      if (communityData) {
        setName(communityData.name || "");
        setDescription(communityData.description || "");
        setCommunityImage(communityData.imageUrl || "");
      }
      setSelectedFile(null);
      setIsModified(false);
    }
  };

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
        setCommunityImage(previewUrl);
        setSelectedFile(file);
        setIsModified(true);

        toast({
          title: "이미지 선택 완료",
          description: "커뮤니티 수정 시 이미지가 함께 업로드됩니다.",
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

  // 이미지 URL 객체 정리
  useEffect(() => {
    return () => {
      if (selectedFile && communityImage.startsWith("blob:")) {
        URL.revokeObjectURL(communityImage);
      }
    };
  }, [selectedFile, communityImage]);

  const checkModified = () => {
    const nameChanged = name !== (communityData?.name || "");
    const descriptionChanged =
      description !== (communityData?.description || "");
    const imageChanged = selectedFile !== null;

    setIsModified(nameChanged || descriptionChanged || imageChanged);
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast({
        title: "입력 오류",
        description: "커뮤니티 이름은 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = communityData?.imageUrl || "";
      let imageId = communityData?.imageId || "";

      // 새 이미지가 선택된 경우 업로드
      if (selectedFile) {
        try {
          const uploadResult = await uploadLargeFile(selectedFile);

          if (
            uploadResult &&
            uploadResult.response &&
            uploadResult.response.data
          ) {
            const fileData = uploadResult.response.data;
            imageUrl = fileData.address || "";
            imageId = fileData.id || "";

            toast({
              title: "이미지 업로드 성공",
              description: "커뮤니티 이미지가 성공적으로 업로드되었습니다.",
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

      // 커뮤니티 정보 업데이트
      if (updateChannel) {
        await updateChannel(name, description, communityData.id, {
          imageUrl: imageUrl,
          id: imageId,
        });
      }

      toast({
        title: "커뮤니티 수정 완료",
        description: "커뮤니티 정보가 성공적으로 업데이트되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("커뮤니티 수정 오류:", error);
      toast({
        title: "커뮤니티 수정 실패",
        description: "커뮤니티 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings size={18} className="text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent2 className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>커뮤니티 설정</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="settings" disabled={!isAdmin} className={`${!isAdmin && "bg-gray-300"}`}>
              설정
            </TabsTrigger>
            <TabsTrigger value="leave">나가기</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="settings" className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-gray-200">
                    <AvatarImage
                      src={
                        communityData.imageRequest?.imageUrl ||
                        "/placeholder.svg"
                      }
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
                      {name ? name.charAt(0).toUpperCase() : "C"}
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
                <div className="text-sm text-gray-500">
                  커뮤니티 이미지 변경
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    이름
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setTimeout(() => checkModified(), 0);
                    }}
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
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setTimeout(() => checkModified(), 0);
                    }}
                    className="col-span-3"
                    placeholder="설명 (선택)"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="bg-[#FFC107] text-white hover:bg-[#FFB300]"
                  onClick={handleUpdate}
                  disabled={loading || !name.trim() || !isModified}
                >
                  {loading ? "처리 중..." : "저장"}
                </Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="leave">
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                커뮤니티를 나가면 모든 채팅 내역에 접근할 수 없게 됩니다. 정말
                나가시겠습니까?
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLeave}
              >
                커뮤니티 나가기
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent2>
    </Dialog>
  );
};

export default CommunitySettingDialog;
