"use client";

import { useToast } from "@/components/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAxios } from "@/hooks/useAxios";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useFileUploadService } from "@/service/api/fileApiV2";
import { Camera, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfileEditModal({ isOpen, onClose, userData }) {
  const { toast } = useToast();
  const { mutate: updateProfile, isLoading } = useUpdateProfile();
  const axios = useAxios();

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    nickname: userData?.nickname || "",
    phone: userData?.phone || "",
    email: userData?.email || "",
    bio: userData?.bio || "",
    image: userData?.image || "",
    selectedFile: null,
    backgroundColor: userData?.backgroundColor,
  });

  console.log("userData", userData);

  // 닉네임 중복 검사 상태
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(true);
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");

  // userData가 변경되면 폼 데이터도 업데이트
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        nickname: userData.nickname || "",
        phone: userData.phone || "",
        email: userData.email || "",
        bio: userData.bio || "",
        image: userData.image || "",
        selectedFile: null,
        backgroundColor: userData.backgroundColor,
      });
      setOriginalNickname(userData.nickname || "");
      setIsNicknameAvailable(true);
      setNicknameMessage("");
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "nickname" && value.length > 20) {
      toast({
        title: "닉네임 길이 초과",
        description: "닉네임은 20자 이내로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "nickname" && value !== originalNickname) {
      setIsNicknameAvailable(false);
      setNicknameMessage("닉네임 중복 확인이 필요합니다.");
    } else if (name === "nickname" && value === originalNickname) {
      setIsNicknameAvailable(true);
      setNicknameMessage("");
    }
  };

  // 닉네임 중복 검사 함수
  const checkNickname = async () => {
    if (!formData.nickname || formData.nickname.trim() === "") {
      setNicknameMessage("닉네임을 입력해주세요.");
      setIsNicknameAvailable(false);
      return;
    }

    if (formData.nickname === originalNickname) {
      setIsNicknameAvailable(true);
      setNicknameMessage("현재 사용 중인 닉네임입니다.");
      return;
    }

    setIsCheckingNickname(true);
    setNicknameMessage("");

    try {
      const res = await axios.fetchPost("auth/check-nickname", {
        nickname: formData.nickname,
      });

      if (res.result) {
        if (res.response.resultCode === 200) {
          setIsNicknameAvailable(true);
          setNicknameMessage(
            res.response.resultMessage || "사용 가능한 닉네임입니다."
          );
        } else {
          setIsNicknameAvailable(false);
          setNicknameMessage(
            res.response.resultMessage || "이미 사용 중인 닉네임입니다."
          );
        }
      } else {
        setIsNicknameAvailable(false);
        setNicknameMessage("닉네임 확인 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("닉네임 확인 실패:", error);
      setIsNicknameAvailable(false);
      setNicknameMessage("닉네임 확인에 실패했습니다.");
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (formData.nickname !== originalNickname && !isNicknameAvailable) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image;

      if (formData.selectedFile) {
        try {
          const uploadedFile = await uploadFileWithPresignedUrl(
            formData.selectedFile
          );
          if (uploadedFile && uploadedFile.address) {
            imageUrl = uploadedFile.address;
            toast({
              title: "이미지 업로드 성공",
              description: "프로필 이미지가 성공적으로 업로드되었습니다.",
              variant: "success",
            });
          } else {
            toast({
              title: "이미지 업로드 실패",
              description: "이미지 업로드에 실패했습니다.",
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error("이미지 업로드 오류:", error);
          toast({
            title: "이미지 업로드 오류",
            description: "이미지 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          return;
        }
      }

      await updateProfile({
        name: formData.name,
        nickname: formData.nickname,
        image: imageUrl,
        bio: formData.bio,
      });

      toast({
        title: "프로필 업데이트",
        description: "프로필이 성공적으로 업데이트되었습니다.",
        variant: "success",
      });

      onClose();
    } catch (error) {
      toast({
        title: "업데이트 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const { uploadFileWithPresignedUrl } = useFileUploadService();

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
        setFormData((prev) => ({
          ...prev,
          selectedFile: file,
          image: previewUrl,
        }));

        toast({
          title: "이미지 선택 완료",
          description: "저장 버튼을 클릭하면 이미지가 업로드됩니다.",
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

  // 컴포넌트 언마운트 시 생성된 객체 URL 정리
  useEffect(() => {
    return () => {
      if (formData.selectedFile && formData.image.startsWith("blob:")) {
        URL.revokeObjectURL(formData.image);
      }
    };
  }, [formData.selectedFile, formData.image]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[100vh] flex flex-col h-full">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-white dark:bg-gray-950 rounded-t-lg">
          <DialogTitle className="text-xl font-bold">프로필 편집</DialogTitle>
        </DialogHeader>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="overflow-y-auto max-h-[calc(85vh-130px)]">
          <div className="p-4 space-y-6">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-gray-200">
                  <AvatarImage
                    src={formData.image || "/placeholder.svg"}
                    alt={formData.nickname || formData.name}
                    onError={(e) => {
                      console.log("이미지 로드 실패:", e);
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <AvatarFallback
                      className="text-white text-[40px]"
                      style={{
                        backgroundColor: formData?.image
                            ? "none"
                            : formData.backgroundColor
                                ? formData.backgroundColor
                                : "#FFC107",
                      }}
                  >
                    {formData.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-navy-600 hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600"
                  onClick={handleImageUpload}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">프로필 사진 변경</div>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <div className="flex gap-2">
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="닉네임을 입력하세요"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={checkNickname}
                    disabled={
                      isCheckingNickname ||
                      !formData.nickname ||
                      formData.nickname === originalNickname
                    }
                    className="whitespace-nowrap"
                  >
                    {isCheckingNickname ? "확인 중..." : "중복 확인"}
                  </Button>
                </div>
                {nicknameMessage && (
                  <p
                    className={`text-xs ${
                      isNicknameAvailable ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isNicknameAvailable && (
                      <Check className="h-3 w-3 inline mr-1" />
                    )}
                    {nicknameMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="전화번호를 입력하세요"
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="자기소개를 입력하세요"
                  className="resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 (버튼 영역) */}
        <div className="p-4 border-t bg-white dark:bg-gray-950 z-[50] rounded-b-lg">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-navy-600 hover:bg-navy-700 text-white"
              disabled={
                isLoading ||
                (formData.nickname !== originalNickname && !isNicknameAvailable)
              }
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
