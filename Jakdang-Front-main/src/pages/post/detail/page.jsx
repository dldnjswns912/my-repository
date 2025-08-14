"use client"

import ImageViewerModal from "@/components/modal/image-viewer-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share,
  X,
  User,
  Share2,
  Smile
} from "lucide-react"
import {useEffect, useRef, useState} from "react"
import { formatRelativeTime } from "@/utils/formatDate"
import { isAuthenticatedAtom, userInfoAtom } from "@/jotai/authAtoms"
import { useAtomValue } from "jotai"
import { useToast } from "@/components/toast-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePostApi } from "@/service/api/postApi"
import WriteModal from "@/components/modal/write-modal/write-modal"
import TipTabViewer from "@/components/modal/detail-modal/tiptab-viewer"
import { useNavigate, useParams } from "react-router-dom"
import AuthRequiredModal from "@/components/modal/auth-required-modal.jsx"
import {CommentComponent, MediaContentComponent, FilesListComponent} from "@/components/modal/detail-modal/channel-detail-modal.jsx";
import {useMediaQuery} from "@/hooks/use-media-query.jsx";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import {clsx} from "clsx";

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState("")
  const [showComments, setShowComments] = useState(true)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [fileIds, setFileIds] = useState(null)
  const userInfo = useAtomValue(userInfoAtom)
  const { toast } = useToast()
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const isAuth = useAtomValue(isAuthenticatedAtom)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  const isMobile = useMediaQuery("(max-width: 1023px)")
  const isMobileH = useMediaQuery("(max-height: 800px)")

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);

  const { createComment, deletePost, likePost, bookmarkPost, usePostDetail } = usePostApi()

  // 게시물 데이터 가져오기
  const { data: postData, isLoading } = usePostDetail(postId, {
    enabled: Boolean(postId),
    onSuccess: (data) => {
      if (data?.data) {
        setCommentCount(data.data.comment_count || 0)
        if (data.data?.file_ids?.length > 0) {
          setFileIds(data.data?.file_ids)
        }
      }
    }
  })

  const post = postData?.data

  useEffect(() => {
    if (post) {
      setCommentCount(post.comment_count || 0)
      if (post?.file_ids?.length > 0) {
        setFileIds(post?.file_ids)
      }
    }
  }, [post])

  const handleCommentDeleted = () => {
    setCommentCount((prevCount) => Math.max(0, prevCount - 1))
  }

  const handleCommentAdded = () => {
    setCommentCount((prevCount) => prevCount + 1)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`)
      toast({
        title: "링크가 복사되었습니다",
        description: "게시물 링크가 클립보드에 복사되었습니다.",
        variant: "success",
      })
    } catch (error) {
      console.error("링크 복사 실패:", error)
      toast({
        title: "링크 복사 실패",
        description: "링크를 복사하는데 실패했습니다.",
        variant: "error",
      })
    }
  }

  const toggleBookmark = async () => {
    if(!isAuth){
      setIsAuthModalOpen(true);
      return;
    }

    const currentBookmarkStatus = post?.is_bookmark
    const res = await bookmarkPost(post.id, userInfo.userId)

    try {
      if (res?.result) {
        toast({
          title: `북마크 ${currentBookmarkStatus ? "취소" : "추가"} 성공`,
          description: `북마크를 ${currentBookmarkStatus ? "취소했습니다" : "추가했습니다"}`,
          variant: "success",
        })
      } else {
        console.error(res)
        toast({
          title: `북마크 ${currentBookmarkStatus ? "취소" : "추가"} 실패`,
          description: `북마크 ${
            currentBookmarkStatus ? "취소" : "추가"
          } 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.`,
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "북마크 작업 실패",
        description: "북마크 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  const toggleLike = async () => {
    try {
      if (!isAuth) {
        setIsAuthModalOpen(true);
        return;
      }

      const currentLikeStatus = post.is_like
      const res = await likePost(post.id, userInfo.userId)

      if (res?.result) {
        toast({
          title: `좋아요 ${currentLikeStatus ? "취소" : "추가"} 성공`,
          description: `좋아요를 ${currentLikeStatus ? "취소했습니다" : "추가했습니다"}`,
          variant: "success",
        })
      } else {
        console.error(res)
        toast({
          title: `좋아요 ${currentLikeStatus ? "취소" : "추가"} 실패`,
          description: `좋아요 ${
            currentLikeStatus ? "취소" : "추가"
          } 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.`,
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "좋아요 작업 실패",
        description: "좋아요 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  const handlePostEditStart = () => {
    setWriteModalOpen(true)
  }

  const onEmojiClick = (selectedEmoji) => {
    // emoji-mart는 선택된 이모지 객체를 직접 반환
    setCommentText((prevText) => prevText + selectedEmoji.native);
    setShowEmojiPicker(false);
  };

  const handlePostDelete = async () => {
    if (!confirm("정말로 이 게시물을 삭제하시겠습니까?")) return

    try {
      const res = await deletePost(post.id, userInfo.userId)

      if (res.result) {
        toast({
          title: "게시물이 삭제되었습니다.",
          description: "게시물이 성공적으로 삭제되었습니다.",
          variant: "success",
        })
        navigate("/")
      } else {
        console.error(res)
        toast({
          title: "게시물 삭제 실패",
          description: "게시물 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "게시물 삭제 실패",
        description: "게시물 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  const handleCommentSubmit = async () => {
    if (!isAuth) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!commentText.trim()) return
    try {
      await createComment({
        postId: post.id,
        authorId: userInfo.userId,
        content: commentText,
      })
      handleCommentAdded()
      toast({
        title: "댓글이 등록되었습니다.",
        description: "댓글이 성공적으로 등록되었습니다.",
        variant: "success",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "댓글 등록 실패",
        description: "댓글 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
    setCommentText("")
  }

  if (isLoading) return <div>로딩중...</div>
  if (!post) return <div>게시물을 찾을 수 없습니다.</div>

  return (
    <div className="min-h-screen bg-slate-50 py-0 lg:py-8 bg-white">
      <div
          className={clsx(
              "container mx-auto h-[100vh] lg:h-[800px] border-[1px] boder-b-0 border-[#dbdbdb] lg:rounded-xl lg:boder-b-1",
              fileIds && fileIds.length > 0 ? "lg:max-w-[1700px]" : "lg:max-w-[1100px]"
          )}
          style={{marginBottom : isMobile ? "65px" : "0px"}}
      >
        {/*<div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm overflow-hidden flex ">*/}
        <div
            className={clsx(
            "z-80 p-0 h-full lg:h-[800px] overflow-auto flex flex-col lg:flex-row border-none shadow-none lg:rounded-xl w-full",
            fileIds && fileIds.length > 0 ? "lg:max-w-[1700px]" : "lg:max-w-[1100px]"
        )}
                         style={{ maxHeight: isMobileH ? "auto" : "100%" }}
        >
          {isMobile && (
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb] h-[65px] bg-white w-full">
                <div className="flex items-center gap-3">
                  {post.author_id === userInfo.userId ? (
                      <DropdownMenu className="relative">
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer">
                            <Avatar className="w-8 h-8 border border-[#dbdbdb]">
                              <AvatarImage src={post.author?.image} />
                              <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">
                          <DropdownMenuItem onClick={handlePostEditStart} className="text-sm py-2.5">
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>수정</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 text-sm py-2.5" onClick={handlePostDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  ) : (
                      <DropdownMenu className="relative z-100">
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer">
                            <Avatar className="w-8 h-8 border border-[#dbdbdb]">
                              <AvatarImage src={post.author?.image} />
                              <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                          </div>
                        </DropdownMenuTrigger>
                        {isAuth && (
                            <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">
                              <DropdownMenuItem
                                  onClick={() => {
                                    onClose() // 먼저 모달 닫기
                                    navigate(`/profile/${post.author_id}`)
                                  }}
                                  className="text-sm py-2.5"
                              >
                                <User className="mr-2 h-4 w-4" />
                                <span>프로필 보기</span>
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem
                              className="text-sm py-2.5"
                              onClick={() => {
                                onClose() // 먼저 모달 닫기
                              }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>메시지 보내기</span>
                          </DropdownMenuItem> */}
                            </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                  )}
                  <div className="flex flex-col">
                    <div className="font-semibold text-sm">{post.author?.nickname}</div>
                    <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>
                  </div>
                </div>

              </div>
          )}
          {!isMobile ? (
              <>
                {fileIds && fileIds.length > 0 && (
                    <>
                      {/* 왼쪽 이미지 섹션 (인스타그램 스타일) */}
                      <div
                          className="overflow-auto bg-black h-auto flex items-center justify-center border-gray-300 border-r-1"
                          style={{ width: '600px', minWidth: '300px', maxWidth: '900px', resize: 'horizontal' }}
                      >
                        <MediaContentComponent
                            postId={postId}
                            fileIds={fileIds}
                            setSelectedImage={setSelectedImage}
                            setIsImageViewerOpen={setIsImageViewerOpen}
                        />
                      </div>
                    </>
                )}
                <div
                    className="flex flex-col bg-white"
                    style={{
                      flexGrow: fileIds ? "1" : "none", // 남은 공간을 차지
                      minWidth: '300px', // 최소 너비
                      maxWidth: fileIds ? 'calc(100% - 300px)' : "none", // 최대 너비 제한
                      width: fileIds ? '700px' : "100%", // 초기 너비
                    }}
                >
                  {/* 오른쪽 컨텐츠 섹션 (인스타그램 스타일) */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb] h-[65px] w-full border-t">
                    <div className="flex items-center gap-3">
                      {post.author_id === userInfo.userId ? (
                          <DropdownMenu className="relative z-100">
                            <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer">
                                <Avatar className="w-8 h-8 border border-[#dbdbdb]">
                                  <AvatarImage src={post.author?.image} />
                                  <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1) || "?"}</AvatarFallback>
                                </Avatar>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">
                              <DropdownMenuItem onClick={handlePostEditStart} className="text-sm py-2.5">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>수정</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 text-sm py-2.5" onClick={handlePostDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>삭제</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      ) : (
                          <DropdownMenu className="relative z-100">
                            <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer">
                                <Avatar className="w-8 h-8 border border-[#dbdbdb]">
                                  <AvatarImage src={post.author?.image} />
                                  <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1) || "?"}</AvatarFallback>
                                </Avatar>
                              </div>
                            </DropdownMenuTrigger>
                            {isAuth && (
                                <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">
                                  <DropdownMenuItem
                                      onClick={() => {
                                        onClose()
                                        navigate(`/profile/${post.author_id}`)
                                      }}
                                      className="text-sm py-2.5"
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>프로필 보기</span>
                                  </DropdownMenuItem>
                                  {/* <DropdownMenuItem
                              className="text-sm py-2.5"
                              onClick={() => {
                                onClose()
                              }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>메시지 보내기</span>
                          </DropdownMenuItem> */}
                                </DropdownMenuContent>
                            )}
                          </DropdownMenu>
                      )}
                      <div className="flex flex-col">
                        <div className="font-semibold text-sm">{post.author?.nickname}</div>
                        <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row w-full justify-between h-[735px]">
                    <div className="flex flex-col h-[50vh] lg:h-full bg-white"
                         style={{
                           flexGrow: fileIds ? "1" : "none",
                           minWidth: '300px',
                           maxWidth: fileIds ? 'calc(100% - 300px)' : "none",
                           width: fileIds ? '100%' : "700px",
                         }}
                    >
                      <div className="px-4 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-full">
                        <div className="prose max-w-none w-full">
                          <div className="flex items-start gap-3 mb-3 w-full">
                            <div className="text-sm w-full">
                              <div className="flex items-baseline gap-1.5 w-full mb-3">
                                <span className="w-full text-[#262626] font-bold break-words whitespace-pre-wrap text-lg" style={{ userSelect: "text", WebkitUserSelect: "text", msUserSelect: "text" }}>{post.title}</span>
                              </div>
                              <div className="mt-1 text-[#262626]">
                                <TipTabViewer post={post} />
                              </div>
                            </div>
                          </div>

                          {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 mb-3">
                                {post.tags.map((tag, index) => (
                                    <span key={index} className="text-[#00376b] text-sm">
                            #{tag}{" "}
                          </span>
                                ))}
                              </div>
                          )}
                        </div>

                        {postId && fileIds && <FilesListComponent postId={postId} fileIds={fileIds} />}
                      </div>
                      <div className="px-4 py-2 border-t border-[#dbdbdb] h-[6vh] flex items-center">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={toggleLike}>
                              <Heart className={`w-5 h-5 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} />
                              <div className="font-semibold text-sm">
                                좋아요 {post.like_count ?? 0} 개
                              </div>
                            </button>
                            <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={toggleLike}>
                              <MessageCircle className="w-5 h-5" />
                              <div className="font-semibold text-sm">
                                댓글 {commentCount ?? 0} 개
                              </div>
                            </button>
                            {/*<button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={handleShare}>*/}
                            {/*  <Share2 className="w-5 h-5" />*/}
                            {/*  <div className="font-semibold text-sm">*/}
                            {/*    공유하기*/}
                            {/*  </div>*/}
                            {/*</button>*/}
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-4">
                              <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={handleShare}>
                                <Share2 className="w-5 h-5" />
                                {/*<div className="font-semibold text-sm">*/}
                                {/*  공유하기*/}
                                {/*</div>*/}
                              </button>
                              <button className="flex items-center justify-center cursor-pointer gap-1" onClick={toggleBookmark}>
                                <Bookmark className={`w-5 h-5 ${post.is_bookmark ? "text-navy-700 fill-navy-600" : ""}`} />
                                {/*<div className="font-semibold text-sm">*/}
                                {/*  북마크*/}
                                {/*</div>*/}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/*<div className="flex flex-row gap-5">*/}
                        {/*  <div className="font-semibold text-sm mb-1">좋아요 {post.like_count ?? 0}개</div>*/}
                        {/*  <div className="font-semibold text-sm mb-1">댓글 {commentCount ?? 0}개</div>*/}
                        {/*</div>*/}

                      </div>
                    </div>

                    <div className="w-[400px] flex flex-col h-[50vh] lg:h-full bg-white">
                      <div className="border-l border-[#dbdbdb] h-full w-[400px]">
                        <div className="p-3 bg-white mt-auto">
                          <div className="flex items-center gap-2 relative"
                               onClick={() => {
                                 if(!isAuth) {
                                   setIsAuthModalOpen(true);
                                   return;
                                 }
                               }}
                          >
                            <button
                                ref={emojiButtonRef}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <Smile className="w-5 h-5" />
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 top-[35px] mb-2 z-100">
                                  <Picker
                                      data={data}
                                      onEmojiSelect={onEmojiClick}
                                      locale="ko"
                                      previewPosition="none"
                                      skinTonePosition="none"
                                      searchPosition="none"
                                      theme="light"
                                      set="native"
                                  />
                                </div>
                            )}

                            <Textarea
                                placeholder={!isAuth ? "로그인 후 작성 가능합니다." : "댓글 달기..."}
                                className="min-h-[40px] max-h-[80px] resize-none text-base border-none focus:ring-0 p-2"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onClick={()=>{

                                }}
                            />
                            <Button
                                className={`text-[#0095f6] font-semibold whitespace-nowrap ${
                                    !commentText.trim() ? "opacity-50" : "opacity-100"
                                }`}
                                variant="ghost"
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim()}
                            >
                              게시
                            </Button>
                          </div>
                        </div>

                        <div className="border-t border-[#dbdbdb] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 h-full max-h-[671px] flex-col-reverse">
                          {showComments && (
                              <div className="px-4 py-2">
                                {postId && (
                                    <CommentComponent
                                        channelId={post.owner_id}
                                        postId={postId}
                                        onCommentDeleted={handleCommentDeleted}
                                        onCommentAdded={handleCommentAdded}
                                    />
                                )}
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
          ) : (
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <div className="w-full lg:w-[700px] flex flex-col h-auto lg:h-full bg-white">
                    <div className="px-4 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-auto">
                      <div className="prose max-w-none w-full">
                        <div className="flex items-start gap-3 mb-3 w-full">
                          <div className="text-sm w-full">
                            <div className="flex items-baseline gap-1.5 mb-2">
                              <span className="text-[#262626] font-bold text-lg">{post.title}</span>
                            </div>
                            <div className="mt-1 text-[#262626]">
                              <TipTabViewer post={post} />
                            </div>
                          </div>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 mb-3">
                              {post.tags.map((tag, index) => (
                                  <span key={index} className="text-[#00376b] text-sm">
                                    #{tag}{" "}
                                  </span>
                              ))}
                            </div>
                        )}
                      </div>

                      {fileIds && fileIds.length > 0 && (
                          <>
                            <div className="w-full lg:w-[600px] h-auto lg:h-full bg-black flex items-center justify-center rounded-md">
                              <MediaContentComponent
                                  postId={postId}
                                  fileIds={fileIds}
                                  setSelectedImage={setSelectedImage}
                                  setIsImageViewerOpen={setIsImageViewerOpen}
                              />
                            </div>
                          </>
                      )}

                      {postId && fileIds && <FilesListComponent postId={postId} fileIds={fileIds} />}
                    </div>
                    <div className="px-4 py-2 border-y border-[#dbdbdb] h-[6vh] flex items-center sticky">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          {/*<button className="flex items-center justify-center cursor-pointer" onClick={toggleLike}>*/}
                          {/*  <Heart className={`w-6 h-6 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} />*/}
                          {/*</button>*/}
                          {/*<button className="flex items-center justify-center cursor-pointer" onClick={handleShare}>*/}
                          {/*  <Share className="w-6 h-6" />*/}
                          {/*</button>*/}
                          <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={toggleLike}>
                            <Heart className={`w-5 h-5 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} />
                            <div className="font-semibold text-sm">
                              좋아요 {post.like_count ?? 0} 개
                            </div>
                          </button>
                          <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={toggleLike}>
                            <MessageCircle className="w-5 h-5" />
                            <div className="font-semibold text-sm">
                              댓글 {commentCount ?? 0} 개
                            </div>
                          </button>
                        </div>
                        <div>
                          {/*<button className="flex items-center justify-center cursor-pointer" onClick={toggleBookmark}>*/}
                          {/*  <Bookmark className={`w-6 h-6 ${post.is_bookmark ? "text-black fill-black" : ""}`} />*/}
                          {/*</button>*/}
                          <div className="flex items-center justify-center gap-4">
                            <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={handleShare}>
                              <Share2 className="w-5 h-5" />
                              {/*<div className="font-semibold text-sm">*/}
                              {/*  공유하기*/}
                              {/*</div>*/}
                            </button>
                            <button className="flex items-center justify-center cursor-pointer gap-1" onClick={toggleBookmark}>
                              <Bookmark className={`w-5 h-5 ${post.is_bookmark ? "text-navy-700 fill-navy-600" : ""}`} />
                              {/*<div className="font-semibold text-sm">*/}
                              {/*  북마크*/}
                              {/*</div>*/}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/*<div className="flex flex-row gap-5">*/}
                      {/*  <div className="font-semibold text-sm mb-1">좋아요 {post.like_count ?? 0}개</div>*/}
                      {/*  <div className="font-semibold text-sm mb-1">댓글 {commentCount ?? 0}개</div>*/}
                      {/*</div>*/}

                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-[400px] flex flex-col h-[20vh] lg:h-full bg-white">
                  <div className="border-l border-[#dbdbdb] h-[10vh]">
                    <div className="p-3 bg-white mt-auto">
                      <div className="flex items-center gap-2"
                           onClick={() => {
                             if(!isAuth) {
                               setIsAuthModalOpen(true);
                               return;
                             }
                           }}
                      >
                        <Textarea
                            placeholder={!isAuth ? "로그인 후 작성 가능합니다." : "댓글 달기..."}
                            className="min-h-[40px] max-h-[80px] resize-none text-base border-none focus:ring-0 p-2"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onClick={()=>{

                            }}
                        />
                        <Button
                            className={`text-[#0095f6] font-semibold whitespace-nowrap ${
                                !commentText.trim() ? "opacity-50" : "opacity-100"
                            }`}
                            variant="ghost"
                            onClick={handleCommentSubmit}
                            disabled={!commentText.trim()}
                        >
                          게시
                        </Button>
                      </div>
                    </div>

                    {/* 댓글 섹션 - 별도 영역으로 분리 */}
                    <div className="border-t border-[#dbdbdb] pt-2 pb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 h-[50vh] flex-col-reverse">
                      {showComments && (
                          <div className="px-4 py-2 h-auto">
                            {/*{postId && (*/}
                                <CommentComponent
                                    channelId={post.owner_id}
                                    postId={post.id}
                                    onCommentDeleted={handleCommentDeleted}
                                    onCommentAdded={handleCommentAdded}
                                />
                            {/*)}*/}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}

      {/*    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb]">*/}
      {/*      <div className="flex items-center gap-3">*/}
      {/*        {post.author_id === userInfo.userId ? (*/}
      {/*          <DropdownMenu>*/}
      {/*            <DropdownMenuTrigger asChild>*/}
      {/*              <div className="cursor-pointer">*/}
      {/*                <Avatar className="w-8 h-8 border border-[#dbdbdb]">*/}
      {/*                  <AvatarImage src={post.author?.image} />*/}
      {/*                  <AvatarFallback>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>*/}
      {/*                </Avatar>*/}
      {/*              </div>*/}
      {/*            </DropdownMenuTrigger>*/}
      {/*            <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">*/}
      {/*              <DropdownMenuItem onClick={handlePostEditStart} className="text-sm py-2.5">*/}
      {/*                <Pencil className="mr-2 h-4 w-4" />*/}
      {/*                <span>수정</span>*/}
      {/*              </DropdownMenuItem>*/}
      {/*              <DropdownMenuItem className="text-red-500 text-sm py-2.5" onClick={handlePostDelete}>*/}
      {/*                <Trash2 className="mr-2 h-4 w-4" />*/}
      {/*                <span>삭제</span>*/}
      {/*              </DropdownMenuItem>*/}
      {/*            </DropdownMenuContent>*/}
      {/*          </DropdownMenu>*/}
      {/*        ) : (*/}
      {/*          <DropdownMenu>*/}
      {/*            <DropdownMenuTrigger asChild>*/}
      {/*              <div className="cursor-pointer">*/}
      {/*                <Avatar className="w-8 h-8 border border-[#dbdbdb]">*/}
      {/*                  <AvatarImage src={post.author?.image} />*/}
      {/*                  <AvatarFallback>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>*/}
      {/*                </Avatar>*/}
      {/*              </div>*/}
      {/*            </DropdownMenuTrigger>*/}
      {/*            <DropdownMenuContent align="start" className="border border-[#dbdbdb] shadow-sm rounded-xl">*/}
      {/*              <DropdownMenuItem*/}
      {/*                onClick={() => navigate(`/profile/${post.author_id}`)}*/}
      {/*                className="text-sm py-2.5"*/}
      {/*              >*/}
      {/*                <User className="mr-2 h-4 w-4" />*/}
      {/*                <span>프로필 보기</span>*/}
      {/*              </DropdownMenuItem>*/}
      {/*              <DropdownMenuItem*/}
      {/*                className="text-sm py-2.5"*/}
      {/*                onClick={() => navigate(`/messages/${post.author_id}`)}*/}
      {/*              >*/}
      {/*                <MessageCircle className="mr-2 h-4 w-4" />*/}
      {/*                <span>메시지 보내기</span>*/}
      {/*              </DropdownMenuItem>*/}
      {/*            </DropdownMenuContent>*/}
      {/*          </DropdownMenu>*/}
      {/*        )}*/}
      {/*        <div className="flex flex-col">*/}
      {/*          <div className="font-semibold text-sm">{post.author?.nickname}</div>*/}
      {/*          <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    /!* 미디어 및 컨텐츠 영역 *!/*/}
      {/*    <div className="flex flex-col md:flex-row min-h-[calc(100vh-200px)]">*/}
      {/*      /!* 미디어 섹션 *!/*/}
      {/*      {fileIds && fileIds.length > 0 && (*/}
      {/*        <div className="w-full md:w-[700px] h-[50vh] md:h-[calc(100vh-200px)] bg-black flex items-center justify-center">*/}
      {/*          <MediaContentComponent*/}
      {/*            postId={post.id}*/}
      {/*            fileIds={fileIds}*/}
      {/*            setSelectedImage={setSelectedImage}*/}
      {/*            setIsImageViewerOpen={setIsImageViewerOpen}*/}
      {/*          />*/}
      {/*        </div>*/}
      {/*      )}*/}

      {/*      /!* 컨텐츠 섹션 *!/*/}
      {/*      <div className={`flex-1 flex flex-col ${fileIds && fileIds.length > 0 ? "md:w-[500px]" : "w-full"}`}>*/}
      {/*        /!* 게시글 내용 *!/*/}
      {/*        <div className="px-4 py-3 flex-1 overflow-y-auto">*/}
      {/*          <div className="prose max-w-none w-full">*/}
      {/*            <div className="flex items-start gap-3 mb-3 w-full">*/}
      {/*              <div className="text-sm w-full">*/}
      {/*                <div className="flex items-baseline gap-1.5">*/}
      {/*                  <span className="text-[#262626] text-lg font-semibold">{post.title}</span>*/}
      {/*                </div>*/}
      {/*                <div className="mt-2 text-[#262626] text-base">*/}
      {/*                  <TipTabViewer post={post} />*/}
      {/*                </div>*/}
      {/*              </div>*/}
      {/*            </div>*/}

      {/*            {post.tags && post.tags.length > 0 && (*/}
      {/*              <div className="flex flex-wrap gap-1 mt-3 mb-3">*/}
      {/*                {post.tags.map((tag, index) => (*/}
      {/*                  <span key={index} className="text-[#00376b] text-sm">*/}
      {/*                    #{tag}{" "}*/}
      {/*                  </span>*/}
      {/*                ))}*/}
      {/*              </div>*/}
      {/*            )}*/}
      {/*          </div>*/}

      {/*          /!* 첨부 파일 *!/*/}
      {/*          {fileIds && <FilesListComponent postId={post.id} fileIds={fileIds} />}*/}
      {/*        </div>*/}

      {/*        /!* 액션 버튼 및 좋아요 정보 *!/*/}
      {/*        <div className="px-4 py-2 border-t border-[#dbdbdb]">*/}
      {/*          <div className="flex items-center justify-between mb-2">*/}
      {/*            <div className="flex items-center gap-4">*/}
      {/*              <button className="flex items-center justify-center" onClick={toggleLike}>*/}
      {/*                <Heart className={`w-6 h-6 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} />*/}
      {/*              </button>*/}
      {/*              <button className="flex items-center justify-center">*/}
      {/*                <MessageCircle className="w-6 h-6" />*/}
      {/*              </button>*/}
      {/*              <button className="flex items-center justify-center" onClick={handleShare}>*/}
      {/*                <Share className="w-6 h-6" />*/}
      {/*              </button>*/}
      {/*            </div>*/}
      {/*            <div>*/}
      {/*              <button className="flex items-center justify-center" onClick={toggleBookmark}>*/}
      {/*                <Bookmark className={`w-6 h-6 ${post.is_bookmark ? "text-black fill-black" : ""}`} />*/}
      {/*              </button>*/}
      {/*            </div>*/}
      {/*          </div>*/}

      {/*          /!* 좋아요 수 *!/*/}
      {/*          <div className="font-semibold text-sm mb-1">좋아요 {post.like_count ?? 0}개</div>*/}

      {/*          /!* 댓글 수 *!/*/}
      {/*          <div*/}
      {/*            className="text-sm text-[#8e8e8e] mb-2 cursor-pointer hover:text-[#262626]"*/}
      {/*            onClick={() => setShowComments(!showComments)}*/}
      {/*          >*/}
      {/*            {showComments ? "댓글 숨기기" : `댓글 ${commentCount}개 모두 보기`}*/}
      {/*          </div>*/}
      {/*        </div>*/}

      {/*        /!* 댓글 섹션 *!/*/}
      {/*        {showComments && (*/}
      {/*          <div className="border-t border-[#dbdbdb] overflow-y-auto flex-1">*/}
      {/*            <div className="px-4 py-2">*/}
      {/*              <CommentComponent*/}
      {/*                channelId={post.owner_id}*/}
      {/*                postId={post.id}*/}
      {/*                onCommentDeleted={handleCommentDeleted}*/}
      {/*                onCommentAdded={handleCommentAdded}*/}
      {/*              />*/}
      {/*            </div>*/}
      {/*          </div>*/}
      {/*        )}*/}

      {/*        /!* 댓글 입력 영역 *!/*/}
      {/*        <div className="border-t border-[#dbdbdb] p-3 bg-white">*/}
      {/*          <div className="flex items-center gap-2">*/}
      {/*            <Textarea*/}
      {/*              disabled={!isAuth}*/}
      {/*              placeholder={!isAuth ? "로그인 후 작성 가능합니다." : "댓글 달기..."}*/}
      {/*              className="min-h-[40px] max-h-[80px] resize-none text-sm border-none focus:ring-0 p-2"*/}
      {/*              value={commentText}*/}
      {/*              onChange={(e) => setCommentText(e.target.value)}*/}
      {/*            />*/}
      {/*            <Button*/}
      {/*              className={`text-[#0095f6] font-semibold whitespace-nowrap ${*/}
      {/*                !commentText.trim() ? "opacity-50" : "opacity-100"*/}
      {/*              }`}*/}
      {/*              variant="ghost"*/}
      {/*              onClick={handleCommentSubmit}*/}
      {/*              disabled={!commentText.trim()}*/}
      {/*            >*/}
      {/*              게시*/}
      {/*            </Button>*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
        </div>
      </div>

      {/* 이미지 뷰어 모달 */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        imageSrc={selectedImage}
        alt={post.title}
      />

      {/* 글쓰기 모달 */}
      <WriteModal
        id={() => post.owner_id}
        fromComponent={"channel"}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        isEditing={true}
        post={post}
      />

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}

// MediaContentComponent와 FilesListComponent, CommentComponent는 channel-detail-modal.jsx에서 가져와서 사용 