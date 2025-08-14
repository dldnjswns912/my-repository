"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationRequest } from "@/hooks/useOrganizationRequest";
import { useFileUploadService } from "@/service/api/fileApiV2";
import { useToast } from "../toast-provider";

export default function OrganizationRegisterModal({ isOpen, onClose }) {
  const { requestOrganization } = useOrganizationRequest();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    type: "",
    location: "",
    description: "",
    website: "",
    logo: "",
    phone: "",
    businessNumber: "",
    applicantRole: "",
  });
  const { uploadFileWithPresignedUrl } = useFileUploadService();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id.replace("org-", "")]: value,
    }));
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    try {
      // 로고 파일이 있을 경우만 업로드 처리
      let logoUrl = formData.logo; // 기존 값 유지

      if (logoFile) {
        try {
          const uploadedFile = await uploadFileWithPresignedUrl(logoFile);
          if (uploadedFile && uploadedFile.address) {
            logoUrl = uploadedFile.address;
            toast({
              title: "이미지 업로드 성공",
              description: "로고 이미지가 성공적으로 업로드되었습니다.",
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

      // 업로드된 로고 URL을 직접 사용하여 API 호출
      await requestOrganization({
        ...formData,
        logo: logoUrl,
        type: formData.type.toUpperCase(),
      });

      // 폼 초기화
      setFormData({
        name: "",
        userName: "",
        type: "",
        location: "",
        description: "",
        website: "",
        logo: "",
        phone: "",
        businessNumber: "",
        applicantRole: "",
      });
      setLogoFile(null);
      onClose();

      toast({
        title: "기관 등록 신청 완료",
        description: "기관 등록 신청이 성공적으로 제출되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("기관 등록 실패:", error);
      toast({
        title: "기관 등록 실패",
        description: "기관 등록 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">기관 등록 신청</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium">
              기관명 *
            </label>
            <Input
              id="org-name"
              placeholder="기관명을 입력하세요"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium">
              기관장 이름 *
            </label>
            <Input
                id="org-userName"
                placeholder="기관장 이름을 입력하세요"
                value={formData.userName}
                onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-type" className="text-sm font-medium">
              기관 유형 *
            </label>
            <select
              id="org-type"
              className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-navy-600 dark:bg-navy-700 dark:border-navy-600"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="">기관 유형을 선택하세요</option>
              <option value="academy">교육기관</option>
              <option value="company">기업</option>
              <option value="government">정부/공공기관</option>
              <option value="nonprofit">비영리단체</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="org-businessNumber" className="text-sm font-medium">
              사업자 번호 *
            </label>
            <Input
              id="org-businessNumber"
              placeholder="예: 123-45-67890"
              value={formData.businessNumber}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-phone" className="text-sm font-medium">
              전화번호 *
            </label>
            <Input
              id="org-phone"
              placeholder="예: 02-1234-5678"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-location" className="text-sm font-medium">
              위치 *
            </label>
            <Input
              id="org-location"
              placeholder="예: 서울특별시 강남구"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-description" className="text-sm font-medium">
              기관 소개 *
            </label>
            <Textarea
              id="org-description"
              placeholder="기관에 대한 간략한 소개를 입력하세요"
              className="min-h-[100px]"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-website" className="text-sm font-medium">
              웹사이트
            </label>
            <Input
              id="org-website"
              placeholder="예: https://www.example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-logo" className="text-sm font-medium">
              로고 이미지
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="org-logo"
                type="file"
                className="flex-1"
                onChange={handleFileChange}
              />
              <div className="text-xs text-gray-500">권장 크기: 200x200px</div>
            </div>
            {logoFile && (
              <div className="text-xs text-green-500">
                선택된 파일: {logoFile.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="org-applicantRole" className="text-sm font-medium">
              신청자 직책/역할 *
            </label>
            <Input
              id="org-applicantRole"
              placeholder="예: 관리자, 교육담당자 등"
              value={formData.applicantRole}
              onChange={handleChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            className="bg-navy-600 hover:bg-navy-700 text-white"
            onClick={handleSubmit}
          >
            신청하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
