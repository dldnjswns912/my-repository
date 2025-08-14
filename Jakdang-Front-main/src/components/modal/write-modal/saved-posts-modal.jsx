import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { userInfoAtom } from "@/jotai/authAtoms";
import { applyTimezoneWithPattern } from "@/utils/formatDate";
import { useAtomValue } from "jotai";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

// 임시저장 글 목록 모달 컴포넌트
export default function SavedPostsModal({ isOpen, onClose, onSelectPost, channelId }) {
  const { toast } = useToast();
  const userInfo = useAtomValue(userInfoAtom);

  // 게시물 데이터 가져오기
    const { useGet } = useAxiosQuery();
    const { data: savedPosts, isLoading: isLoadingSavedPosts, error: errorSavedPosts } = useGet(
      ["savedPosts"],
      `${import.meta.env.VITE_API_URL}/posts`,
      {
        member_id: userInfo?.userId,
        authorId: userInfo?.userId,
        ownerId: channelId,
        postType: "CHANNEL",
        sort: "publishedTime,desc",
        published: false,
        size: 5,
        page: 0,
      }
    );

  const handleSelectPost = (post) => {
    onSelectPost(post);
    onClose();
  };

  const handleDeletePost = async (id, e) => {
    e.stopPropagation(); // 버블링 방지
    try {
      // API 호출 예시 (실제 API는 구현 필요)
      // await yourApi.deleteSavedPost(id);

      toast({
        title: "삭제 완료",
        description: "임시저장 글이 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "임시저장 글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>임시저장된 글 목록</DialogTitle>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoadingSavedPosts ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            </div>
          ) : savedPosts?.data.content
                  //.filter(post => post.author_id === userInfo.userId)
                  .length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              임시저장된 글이 없습니다.
            </div>
          ) : errorSavedPosts ? (
            <div className="text-center py-8 text-red-500">
              임시저장 글 목록을 불러오는 데 실패했습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {savedPosts?.data.content
                //.filter(post => post.author_id === userInfo.userId)
                .map(post => (
                <div
                  key={post.id}
                  onClick={() => handleSelectPost(post)}
                  className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-gray-500">{applyTimezoneWithPattern(post.created_at, 1)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDeletePost(post.id, e)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}