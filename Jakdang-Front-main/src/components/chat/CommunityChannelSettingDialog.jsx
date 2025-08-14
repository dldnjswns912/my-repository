"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent2,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../toast-provider";

const ChannelSettingDialog = ({
  category,
  handleDeleteCategory,
  handleUpdateCategory,
  isAdmin = false, // 관리자 여부 확인을 위한 prop
}) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  console.log("category", category);    

  // 카테고리 데이터가 변경될 때 상태 초기화
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
      setIsModified(false);
    }
  }, [category]);

  // 관리자가 아닌 경우 기본 탭을 삭제로 설정
  useEffect(() => {
    if (!isAdmin) {
      setActiveTab("delete");
    }
  }, [isAdmin]);

  // 모달이 닫힐 때 입력값 초기화
  const handleDialogChange = (open) => {
    if (!open) {
      // 관리자일 경우에만 수정 탭으로 초기화
      setActiveTab(isAdmin ? "edit" : "delete");
      if (category) {
        setName(category.name || "");
        setDescription(category.description || "");
      }
      setIsModified(false);
    }
  };

  const checkModified = () => {
    const nameChanged = name !== (category?.name || "");
    const descriptionChanged = description !== (category?.description || "");
    setIsModified(nameChanged || descriptionChanged);
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast({
        title: "입력 오류",
        description: "채널 이름은 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    // async (name, description, channelId, categoryId, displayOrder = 0) => {

    setLoading(true);
    try {
      // 채널 정보 업데이트
      if (handleUpdateCategory) {
        await handleUpdateCategory(name, description, category.channelId, category.id, 0);
      }

      toast({
        title: "채널 수정 완료",
        description: "채널 정보가 성공적으로 업데이트되었습니다.",
        variant: "success",
      });
      setIsModified(false);
    } catch (error) {
      console.error("채널 수정 오류:", error);
      toast({
        title: "채널 수정 실패",
        description: "채널 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("정말로 이 채널을 삭제하시겠습니까?")) {
      handleDeleteCategory(category.id, category.channelId);
    }
  };

  return (
    <Dialog onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <span className="ml-2" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="w-[18px] h-[18px] text-gray-500 hover:text-gray-700" />
        </span>
      </DialogTrigger>
      <DialogContent2 className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>채널 설정</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="edit" disabled={!isAdmin}>
              수정
            </TabsTrigger>
            <TabsTrigger value="delete">삭제</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="edit" className="space-y-4">
              <div className="py-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="channelName" className="text-right">
                      이름
                    </Label>
                    <Input
                      id="channelName"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setTimeout(() => checkModified(), 0);
                      }}
                      className="col-span-3"
                      placeholder="채널 이름"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="channelDesc" className="text-right">
                      설명
                    </Label>
                    <Input
                      id="channelDesc"
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
              </div>
            </TabsContent>
          )}

          <TabsContent value="delete">
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">채널 정보</h3>
                <p className="text-sm text-gray-500">
                  채널 이름: {category.name}
                </p>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    설명: {category.description}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                채널을 삭제하면 모든 대화 내용이 영구적으로 삭제됩니다. 이
                작업은 되돌릴 수 없습니다.
              </p>
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                채널 삭제
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent2>
    </Dialog>
  );
};

export default ChannelSettingDialog;
