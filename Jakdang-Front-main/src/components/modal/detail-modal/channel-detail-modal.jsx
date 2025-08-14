"use client"

import ImageWithFallback from "@/components/image-with-fallback"
import ImageViewerModal from "@/components/modal/image-viewer-modal"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Bookmark, Heart, MessageCircle, MoreVertical, Pencil, Trash2, Share, X, User, Smile, Share2, Forward } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { formatRelativeTime } from "@/utils/formatDate"
import { isAuthenticatedAtom, userInfoAtom } from "@/jotai/authAtoms"
import { useAtomValue } from "jotai"
import { useToast } from "../../toast-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePostApi } from "@/service/api/postApi"
import { useFileApi } from "@/service/api/fileApi"
import WriteModal from "@/components/modal/write-modal/write-modal"
import TipTabViewer from "./tiptab-viewer"
import { useNavigate } from "react-router-dom"
import AuthRequiredModal from "@/components/modal/auth-required-modal.jsx";
import {clsx} from "clsx";
import {useMediaQuery} from "@/hooks/use-media-query.jsx";
import ShareDialog from "@/components/shared/ShareDialog"

export default function ChannelDetailModal({ isOpen, onClose, channelId, post, onLikeClick, onBookmarkClick }) {
  const [commentText, setCommentText] = useState("")
  const [showComments, setShowComments] = useState(true)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [postId, setPostId] = useState("")
  const [fileIds, setFileIds] = useState(null)
  const userInfo = useAtomValue(userInfoAtom)
  const { toast } = useToast()
  const [showAlert, setShowAlert] = useState(false)
  const navigate = useNavigate()
  const isAuth = useAtomValue(isAuthenticatedAtom)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // 수정 모달이 열려있을 때 기존 모달 숨김 처리
  const [isEditMode, setIsEditMode] = useState(false);

  const isMobile = useMediaQuery("(max-width: 1023px)")
  const isMobileH = useMediaQuery("(max-height: 800px)")

  const [commentCount, setCommentCount] = useState(0)

  const { createComment, deletePost } = usePostApi()

  const handleContinue = () => {
    setShowAlert(false)
    navigate("/")
  }

  useEffect(() => {
    if (post) {
      setCommentCount(post.comment_count || 0)
    }
  }, [post])

  const handleCommentDeleted = () => {
    setCommentCount((prevCount) => Math.max(0, prevCount - 1))
  }

  const handleCommentAdded = () => {
    setCommentCount((prevCount) => prevCount + 1)
  }

  useEffect(() => {
    if (!isOpen) {
      setFileIds(null)
      setPostId("")
    } else {
      if (post) {
        setPostId(post?.id)

        if (post?.file_ids?.length > 0) {
          setFileIds(post?.file_ids)
        }
      }
    }
  }, [isOpen, post])

  useEffect(() => {
    return () => {
      setFileIds(null)
      setPostId("")
    }
  }, [])

  if (!post) return null

  const toggleBookmark = async () => {
    if(!isAuth){
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await onBookmarkClick(post.id);
      if (res?.result) {
        toast({
          title: `북마크 ${post.is_bookmark ? "취소" : "추가"} 성공`,
          description: `북마크를 ${post.is_bookmark ? "취소했습니다" : "추가했습니다"}`,
          variant: "success",
        });
      } else {
        console.error(res);
        toast({
          title: `북마크 ${post.is_bookmark ? "취소" : "추가"} 실패`,
          description: `북마크 ${
              post.is_bookmark ? "취소" : "추가"
          } 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.`,
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "북마크 작업 실패",
        description: "북마크 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  const toggleLike = async () => {
    try {
      if (!isAuth) {
        setIsAuthModalOpen(true);
        return;
      }


      const currentLikeStatus = post.is_like
      const res = await onLikeClick(post.id)

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
    setIsEditMode(true);
  }

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
        onClose()
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
      alert("정상적이지 않은 접근입니다.")
      navigate("/login")
      return
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

  const handleShare = () => {
    setIsShareDialogOpen(true);
  }

  const onEmojiClick = (selectedEmoji) => {
    // emoji-mart는 선택된 이모지 객체를 직접 반환
    setCommentText((prevText) => prevText + selectedEmoji.native);
    setShowEmojiPicker(false);
  };

  const handleClose = () => {
    setCommentText(""); // 댓글 내용 초기화
    setShowEmojiPicker(false);
    onClose();
  }

  // WriteModal이 닫힐 때 호출될 핸들러
  const handleWriteModalClose = () => {
    setIsEditMode(false);
  }

  return (
      <>
        <Dialog open={isOpen && !isEditMode} onOpenChange={handleClose} className="bg-black/70 z-40">
          <DialogContent
              className={clsx(
                  "z-80 p-0 min-h-0 overflow-auto flex flex-col lg:flex-row border-none shadow-none lg:rounded-xl w-full",
                  fileIds && fileIds.length > 0 ? "lg:max-w-[1700px]" : "lg:max-w-[1100px]"
              )}
              style={{ maxHeight: isMobileH ? "auto" : "100%" }}
          >
            {isMobile && (
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb] h-[65px]">
                  <div className="flex items-center gap-3">
                    {post.author_id === userInfo.userId ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 border border-[#dbdbdb]" src={post.author?.image}>
                            <AvatarImage src={post.author?.image} />
                            <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="ml-1 p-1 rounded-full hover:bg-gray-100" aria-label="더보기">
                                <MoreVertical className="w-5 h-5" />
                              </button>
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
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
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
                                        onClose();
                                        navigate(`/profile/${post.author_id}`);
                                      }}
                                      className="text-sm py-2.5"
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>프로필 보기</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                            )}
                          </DropdownMenu>
                          <div className="flex flex-col">
                            <div className="font-semibold text-sm">{post.author?.nickname}</div>
                            <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
            )}
            {!isMobile ? (
                <>
                  {fileIds && fileIds.length > 0 && (
                      <>
                        {/* 왼쪽 이미지 섹션 (인스타그램 스타일) */}
                        <div
                            className="overflow-auto bg-black flex items-center justify-center border-gray-300 border-r-1"
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
                      className="flex flex-col bg-white max-h-[700px] h-[100vh]"
                      style={{
                        flexGrow: fileIds ? "1" : "none", // 남은 공간을 차지
                        minWidth: '300px', // 최소 너비
                        maxWidth: fileIds ? 'calc(100% - 300px)' : "none", // 최대 너비 제한
                        width: fileIds ? '700px' : "100%", // 초기 너비
                      }}
                  >
                    {/* 오른쪽 컨텐츠 섹션 (인스타그램 스타일) */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb] w-full">
                      <div className="flex items-center gap-3">
                        {post.author_id === userInfo.userId ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8 border border-[#dbdbdb]" src={post.author?.image}>
                                <AvatarImage src={post.author?.image} />
                                <AvatarFallback className="text-white" style={{backgroundColor: post.author?.backgroundColor || "#FFC107"}}>{post.author?.nickname?.substring(0, 1)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <div className="font-semibold text-sm">{post.author?.nickname}</div>
                                <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="ml-1 p-1 rounded-full hover:bg-gray-100" aria-label="더보기">
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
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
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
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
                                            onClose();
                                            navigate(`/profile/${post.author_id}`);
                                          }}
                                          className="text-sm py-2.5"
                                      >
                                        <User className="mr-2 h-4 w-4" />
                                        <span>프로필 보기</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                )}
                              </DropdownMenu>
                              <div className="flex flex-col">
                                <div className="font-semibold text-sm">{post.author?.nickname}</div>
                                <div className="text-xs text-[#8e8e8e]">{formatRelativeTime(post.published_time, 1)}</div>
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 h-full overflow-y-auto">
                      <div className="flex flex-col h-[50vh] lg:h-full bg-white border-l border-1 border-[#dbdbdb]"
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
                        <div className="px-4 py-2 border-t border-[#dbdbdb] h-[50px] flex items-center">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" onClick={toggleLike}>
                                <Heart className={`w-5 h-5 ${post.is_like ? "text-red-500 fill-red-500" : ""}`} />
                                <div className="font-semibold text-sm">
                                  좋아요 {post.like_count ?? 0} 개
                                </div>
                              </button>
                              <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" >
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

                      <div className="w-[400px] flex flex-col bg-white">
                        <div className="w-[400px] p-3 bg-white ">
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

                        <div className="w-[400px] h-full sm: pb-2 overflow-hidden bg-white flex border-t border-[#dbdbdb] flex-col-reverse">
                          {showComments && (
                              <div className="px-2 py-4 overflow-y-auto h-full">
                                {postId && (
                                    <CommentComponent
                                        channelId={channelId}
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
                </>
            ) : (
                <div className="flex flex-col overflow-y-auto">
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
                            <button className="flex items-center justify-center cursor-pointer gap-1 h-auto" >
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
                  <div className="w-full lg:w-[400px] flex flex-col lg:h-full bg-white">
                    <div className="border-l border-[#dbdbdb]">
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
                      <div className="border-t border-[#dbdbdb] pt-2 pb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 flex-col-reverse">
                        {showComments && (
                            <div className="px-4 py-2 h-auto">
                              {postId && (
                                  <CommentComponent
                                      channelId={channelId}
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
            )}
          </DialogContent>
        </Dialog>

        {/* 이미지 뷰어 모달 */}
        <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            imageSrc={selectedImage}
            alt={post.title}
            className="z-[100]"
        />

        <AuthRequiredModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            className="z-[100]"
        />

        {
            isShareDialogOpen && post &&
            <ShareDialog
                isOpen={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                post={post}
            />
        }

        {/* 글쓰기 모달 */}
        <WriteModal
            id={() => {
              return channelId;
            }}
            fromComponent={"channel"}
            isOpen={isEditMode}
            onClose={handleWriteModalClose}
            isEditing={post}
            post={post}
        />


      </>
  )
}

export const MediaContentComponent = ({ postId, fileIds, setSelectedImage, setIsImageViewerOpen }) => {
  const [images, setImages] = useState(null)
  const [videos, setVideos] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { useGetAllFilesInfo } = useFileApi()
  const { data: res, isLoading, error } = useGetAllFilesInfo(postId, fileIds)

  useEffect(() => {
    if (!isLoading) {
      const data = res?.data
      const images = data?.filter((file) => file.type === "image")
      const videos = data?.filter((file) => file.type === "video")
      setImages(images)
      setVideos(videos)
    }
  }, [isLoading])

  const allMedia = [...(images || []), ...(videos || [])]

  const handleNext = () => {
    if (allMedia.length > 1) {
      setActiveIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1))
    }
  }

  const handlePrev = () => {
    if (allMedia.length > 1) {
      setActiveIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1))
    }
  }

  if (!allMedia || allMedia.length === 0) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-400">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-60"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p className="text-sm font-medium">이미지가 없습니다</p>
        </div>
    )
  }

  return (
      <div className="relative w-full h-full ">
        {allMedia.length > 0 && (
            <div className="w-full h-[200px] lg:h-full relative">
              {allMedia.map((media, index) => (
                  <div
                      key={media.id}
                      className={`absolute w-full h-full transition-opacity duration-300 ${
                          index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                      }`}
                  >
                    {media.type === "image" ? (
                        <div
                            className="w-full h-full cursor-pointer"
                            onClick={() => {
                              setSelectedImage(media?.address)
                              setIsImageViewerOpen(true)
                            }}
                        >
                          <ImageWithFallback
                              src={media?.address || "/placeholder.svg"}
                              alt={media?.name}
                              className="w-full h-full object-contain"
                              quality={85}
                              fallbackSrc="/placeholder.svg?height=600&width=600"
                          />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <video controls className="max-w-full max-h-full" preload="metadata">
                            <source src={media.address} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                    )}
                  </div>
              ))}

              {/* 인스타그램 스타일 페이지네이션 인디케이터 */}
              {allMedia.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {allMedia.map((_, index) => (
                        <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                index === activeIndex ? "bg-white scale-110" : "bg-white/40"
                            }`}
                            onClick={() => setActiveIndex(index)}
                        ></div>
                    ))}
                  </div>
              )}

              {/* 인스타그램 스타일 좌우 네비게이션 버튼 */}
              {allMedia.length > 1 && (
                  <>
                    <button
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white"
                        onClick={handlePrev}
                    >
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white"
                        onClick={handleNext}
                    >
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </>
              )}
            </div>
        )}
      </div>
  )
}

// 파일 목록 컴포넌트 - 인스타그램 스타일
export const FilesListComponent = ({ postId, fileIds }) => {
  const [files, setFiles] = useState(null)

  const { useGetAllFilesInfo } = useFileApi()
  const { data: res, isLoading, error } = useGetAllFilesInfo(postId, fileIds)

  useEffect(() => {
    if (!isLoading) {
      const data = res?.data
      const files = data?.filter((file) => file.type === "file")
      if (files?.length > 0) {
        setFiles(files)
      }
    }
  }, [isLoading])

  return (
      <>
        {files && files.length > 0 && (
            <div className="mt-3 bg-[#fafafa] rounded-md p-3 border border-[#efefef]">
              <div className="text-xs font-medium text-[#8e8e8e] mb-1.5">첨부 파일</div>
              {files.map((file) => (
                  <a
                      key={file.id}
                      href={file.address}
                      download={file.name}
                      className="flex items-center gap-2 text-sm text-[#0095f6] py-1.5 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0
v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">{file.name}</span>
                  </a>
              ))}
            </div>
        )}
      </>
  )
}

// 댓글 컴포넌트 - 인스타그램 스타일
export const CommentComponent = ({ channelId, postId, onCommentDeleted, onCommentAdded }) => {
  const { createComment, updateComment, deleteComment, useComments } = usePostApi()
  const { isLoading: isLoadingComment, data: dataComment, error: errorComment } = useComments(postId)

  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState("")
  const userInfo = useAtomValue(userInfoAtom)
  const { toast } = useToast()

  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editText, setEditText] = useState("")
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const isAuth = useAtomValue(isAuthenticatedAtom)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);


  const handleEditStart = (comment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.content)
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
    setEditText("")
  }

  const handleEditSubmit = async (commentId) => {
    if (!editText.trim()) return
    try {
      const res = await updateComment({
        id: commentId,
        postId: postId,
        authorId: userInfo.userId,
        content: editText,
      })
      if (res.result) {
        toast({
          title: "댓글이 수정되었습니다.",
          description: "댓글이 성공적으로 수정되었습니다.",
          variant: "success",
        })
        setEditingCommentId(null)
        setEditText("")
      } else {
        console.error(res)
        toast({
          title: "댓글 수정 실패",
          description: "댓글 수정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "댓글 수정 실패",
        description: "댓글 수정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return

      const res = await deleteComment(postId, commentId, userInfo.userId)
      if (res.result) {
        onCommentDeleted()
        toast({
          title: "댓글이 삭제되었습니다.",
          description: "댓글이 성공적으로 삭제되었습니다.",
          variant: "success",
        })
      } else {
        console.error(res)
        toast({
          title: "댓글 삭제 실패",
          description: "댓글 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "댓글 삭제 실패",
        description: "댓글 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  const handleReplySubmit = async (commentId) => {

    if (!replyText.trim()) return
    try {
      const res = await createComment({
        postId: postId,
        authorId: userInfo.userId,
        content: replyText,
        parentId: commentId,
      })
      if (res.result) {
        onCommentAdded()
        toast({
          title: "답글이 등록되었습니다.",
          description: "답글이 성공적으로 등록되었습니다.",
          variant: "success",
        })
        setReplyingTo(null)
        setReplyText("")
      } else {
        console.error(res)
        toast({
          title: "답글 등록 실패",
          description: "답글 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "답글 등록 실패",
        description: "답글 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "error",
      })
    }
  }

  return (
      <div className="space-y-4 h-[100%]">
        {errorComment && (
            <div className="text-center text-sm text-[#8e8e8e]">댓글을 불러오는 중 오류가 발생했습니다.</div>
        )}

        {!isLoadingComment && dataComment?.data?.length === 0 && (
            <div className="text-center text-sm text-[#8e8e8e]">첫 댓글을 남겨보세요.</div>
        )}

        {isLoadingComment && <div className="text-center text-sm text-[#8e8e8e]">댓글을 불러오는 중입니다...</div>}

        {!isLoadingComment &&
            dataComment?.data?.slice().reverse().map((comment) => (
                <div key={comment.id} className="mb-4 max-w-full">
                  <div className="flex gap-2">
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5 border border-[#dbdbdb]">
                      <AvatarImage src={comment.author?.image} alt={comment.author?.nickname} />
                      <AvatarFallback className="text-white" style={{'backgroundColor': comment.author.backgroundColor ? comment.author.backgroundColor : "#FFC107"}}>{comment.author?.nickname?.substring(0, 1)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {editingCommentId === comment.id ? (
                          <div className="flex gap-2">
                            <Textarea
                                className="min-h-[40px] flex-1 resize-none text-base border border-[#dbdbdb] rounded-md"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                  className="text-xs h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white"
                                  onClick={() => handleEditSubmit(comment.id)}
                                  disabled={!editText.trim()}
                                  size="sm"
                              >
                                저장
                              </Button>
                              <Button
                                  variant="outline"
                                  className="text-xs h-8 border-[#dbdbdb]"
                                  onClick={handleEditCancel}
                                  size="sm"
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                      ) : (
                          <>
                            <div className="text-sm break-words">
                              <span className="font-semibold mr-2">{comment.author?.nickname}</span>
                              <span className="whitespace-normal text-[#262626] select-text" style={{ userSelect: "text", WebkitUserSelect: "text", msUserSelect: "text" }}>{comment.content}</span>
                            </div>

                            <div className="flex items-center gap-4 mt-1 text-xs text-[#8e8e8e]">
                              <span>{formatRelativeTime(comment.createdAt, 1)}</span>
                              <button
                                  className="hover:text-[#262626] font-medium"
                                  onClick={() => {
                                    if(!isAuth) {
                                      setIsAuthModalOpen(true);
                                      return;
                                    }
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                                  }
                                  }
                              >
                                {replyingTo === comment.id ? "취소" : "답글 달기"}
                              </button>

                              {comment.authorId === userInfo.userId && !comment.deleted && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="hover:text-[#262626]">
                                        <MoreVertical className="h-3 w-3" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="text-xs border border-[#dbdbdb] shadow-sm rounded-xl"
                                    >
                                      <DropdownMenuItem onClick={() => handleEditStart(comment)} className="text-xs py-2">
                                        <Pencil className="mr-2 h-3 w-3" />
                                        <span>수정</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          className="text-red-500 text-xs py-2"
                                          onClick={() => handleDeleteComment(comment.id)}
                                      >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        <span>삭제</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                              )}
                            </div>
                          </>
                      )}

                      {replyingTo === comment.id && (
                          <div className="flex gap-2 mt-2">
                            <Avatar className="w-6 h-6 border border-[#dbdbdb]">
                              <AvatarImage src={userInfo.image} alt={userInfo.nickname} />
                              <AvatarFallback className="text-white" style={{
                                "backgroundColor": userInfo?.image ? "none" : userInfo.backgroundColor ?  userInfo.backgroundColor : "#FFC107"
                              }}>{userInfo.nickname?.substring(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <input
                                  type="text"
                                  placeholder={!isAuthenticated ? "로그인 후 작성 가능합니다." : "답글 달기..."}
                                  className="w-full text-sm border border-[#dbdbdb] rounded-full px-3 py-1 focus:outline-none focus:border-[#a8a8a8]"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                              />
                              <Button
                                  className="text-[#0095f6] font-semibold"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={!replyText.trim()}
                              >
                                게시
                              </Button>
                            </div>
                          </div>
                      )}

                      {/* 대댓글 표시 */}
                      {comment.childComments && comment.childComments?.length > 0 && (
                          <div className="mt-2 ml-4 space-y-3 max-w-full">
                            {comment.childComments.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                  <Avatar className="w-6 h-6 shrink-0 mt-0.5 border border-[#dbdbdb]">
                                    <AvatarImage src={reply.author.image} alt={reply.author.nickname} />
                                    <AvatarFallback className="text-white"
                                                    style={{
                                                      backgroundColor: reply.author?.image
                                                          ? "none"
                                                          : reply.author?.backgroundColor
                                                              ? reply.author?.backgroundColor
                                                              : "#FFC107",
                                                    }}
                                    >{reply.author.nickname?.substring(0, 1)}</AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    {editingCommentId === reply.id ? (
                                        <div className="flex gap-2">
                                          <Textarea
                                              className="min-h-[40px] flex-1 resize-none text-base border border-[#dbdbdb] rounded-md"
                                              value={editText}
                                              onChange={(e) => setEditText(e.target.value)}
                                          />
                                          <div className="flex flex-col gap-1">
                                            <Button
                                                className="text-xs h-7 bg-[#0095f6] hover:bg-[#1877f2] text-white"
                                                onClick={() => handleEditSubmit(reply.id)}
                                                disabled={!editText.trim()}
                                                size="sm"
                                            >
                                              저장
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="text-xs h-7 border-[#dbdbdb]"
                                                onClick={handleEditCancel}
                                                size="sm"
                                            >
                                              취소
                                            </Button>
                                          </div>
                                        </div>
                                    ) : (
                                        <>
                                          <div className="text-sm break-words">
                                            <span className="font-semibold mr-2">{reply.author?.nickname}</span>
                                            <span className="whitespace-normal text-[#262626] select-text" style={{ userSelect: "text", WebkitUserSelect: "text", msUserSelect: "text" }}>{reply.content}</span>
                                          </div>

                                          <div className="flex items-center gap-4 mt-1 text-xs text-[#8e8e8e]">
                                            <span>{formatRelativeTime(reply.createdAt, 1)}</span>

                                            {reply.authorId === userInfo.userId && (
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <button className="hover:text-[#262626]">
                                                      <MoreVertical className="h-3 w-3" />
                                                    </button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent
                                                      align="end"
                                                      className="text-xs border border-[#dbdbdb] shadow-sm rounded-xl"
                                                  >
                                                    <DropdownMenuItem onClick={() => handleEditStart(reply)} className="text-xs py-2">
                                                      <Pencil className="mr-2 h-3 w-3" />
                                                      <span>수정</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500 text-xs py-2"
                                                        onClick={() => handleDeleteComment(reply.id)}
                                                    >
                                                      <Trash2 className="mr-2 h-3 w-3" />
                                                      <span>삭제</span>
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                          </div>
                                        </>
                                    )}
                                  </div>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
        <AuthRequiredModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            className="z-[100]"
        />
      </div>
  )
}

