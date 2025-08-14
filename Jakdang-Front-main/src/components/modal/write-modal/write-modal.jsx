"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, DialogContent2,
} from "@/components/ui/dialog";
import {
  FileText,
  ImageIcon,
  Paperclip,
  YoutubeIcon,
  Code,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

// 파일 상단에 useToast 훅 import 추가
import { useToast } from "@/components/toast-provider";
import { useAtomValue } from "jotai";
import { accessTokenAtom, userInfoAtom } from "@/jotai/authAtoms";

import { useQueryClient } from "@tanstack/react-query";
import { usePostApi } from "@/service/api/postApi";
import { useChannelApi } from "@/service/api/channelApi";
import { useFileApi } from "@/service/api/fileApi";
import {
  handleDocumentChange,
  handleImageFileChange,
  handleVideoFileChange,
  sendFileData,
} from "@/utils/fileUpload";

import "./write-modal.css";
import "highlight.js/styles/github-dark.css";

import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { all, createLowlight } from "lowlight";
import { CodeBlockWithLineNumbers } from "@/components/editor/CodeBlockWithLineNumbers";
import Placeholder from "@tiptap/extension-placeholder";
import { LANGUAGES } from "./languages";

// Youtube 확장 추가
import Youtube from "@tiptap/extension-youtube";
import { clsx } from "clsx";
import ImageViewerModal from "@/components/modal/image-viewer-modal.jsx";
import ImageWithFallback from "@/components/image-with-fallback.jsx";
import { useMediaQuery } from "@/hooks/use-media-query.jsx";

export default function WriteModal({
  id,
  fromComponent,
  isOpen,
  onClose,
  isEditing = false,
  post = null,
}) {
  // 컴포넌트가 마운트된 후 초기화 여부 추적을 위한 플래그
  const [didMount, setDidMount] = useState(false);

  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    setDidMount(true);

    // 컴포넌트 언마운트 시 실행될 정리 함수
    return () => {
      // 에디터 참조 정리
      editorRef.current = null;
    };
  }, []);

  // 컴포넌트 내부에서 useToast 훅 사용
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(undefined);

  const [files, setFiles] = useState([]);
  const [originalFiles, setOriginalFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const allowedExtensions =
    "image/*, video/* .txt, .doc, .docx, .pdf, .ppt, .pptx, .xls, .xlsx, .hwp, .hwt";
  const allowedExtensions2 =
    ".txt, .doc, .docx, .pdf, .ppt, .pptx, .xls, .xlsx, .hwp, .hwt";
  const [loading, setLoading] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOpenSavedModal, setIsOpenSavedModal] = useState(false);
  const [fileIds, setFileIds] = useState(post?.file_ids ?? null);
  const [postId, setPostId] = useState(post?.id ?? null);
  const [isLoadPost, setIsLoadPost] = useState(false);

  // Youtube 관련 상태 추가
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  // Editor 객체 참조 저장
  const editorRef = useRef(null);

  const queryClient = useQueryClient();
  const userInfo = useAtomValue(userInfoAtom);
  const token = useAtomValue(accessTokenAtom);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const [previewImages, setPreviewImages] = useState([]);

  const { createPost, updatePost } = usePostApi();
  const { useGetAllFilesInfo } = useFileApi();
  const { activeChannelsQuery } = useChannelApi();
  const {
    isLoading: channelIsLoading,
    data: channelData,
    error: channelError,
  } = activeChannelsQuery;
  const {
    isLoading: fileInfoIsLoading,
    data: fileInfoData,
    error: fileInfoError,
    refetch: refetchFileInfo,
  } = useGetAllFilesInfo(postId || null, fileIds || [], {
    enabled:
      isOpen && !!postId && Array.isArray(fileIds) && fileIds?.length > 0,
  });

  const lowlight = createLowlight(all);

  const getContentPlaceholder = () => {
    switch (fromComponent) {
      case "channel":
      case "organization":
        return "내용을 입력해주세요.";
      case "organization_question":
        return `질문 내용을 자세히 작성해주세요.

• 질문 배경과 목적
• 시도해본 방법
• 원하는 해결 방향

자세한 설명을 통해 더 좋은 답변을 받을 수 있습니다.`;
      default:
        return "???";
    }
  };

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: getContentPlaceholder(),
      }),
      CodeBlockWithLineNumbers.configure({
        lowlight,
        HTMLAttributes: {
          class: "code-block-with-line-numbers",
        },
      }),
      // Youtube 확장 추가 - 설정 강화
      Youtube.configure({
        width: "100%",
        height: "100%",
        HTMLAttributes: {
          class: "w-full h-[300px] lg:h-[400px] rounded-lg",
        },
        allowFullscreen: true,
        nocookie: false, // YouTube 쿠키 허용 (기본값)
        controls: true, // 컨트롤바 표시 (기본값)
        modestBranding: false, // YouTube 로고 표시 (기본값)
        progressBarColor: "red", // 진행 바 색상
        rel: 0, // 관련 동영상 표시 안 함
        disablekb: 0, // 키보드 단축키 활성화
      }),
    ],
    editorProps: {
      attributes: {
        class: "min-h-[200px]",
      },
    },
  });

  // 에디터 인스턴스를 참조에 저장
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;

      // 컴포넌트 언마운트 시 에디터 정리를 위한 cleanup 함수
      return () => {
        if (editorRef.current) {
          // 에디터 참조 정리
          editorRef.current = null;
        }
      };
    }
  }, [editor]);

  useEffect(() => {
    if (editor !== null && isOpen && post?.contents) {
      // 에디터가 준비되었고 모달이 열려있고 포스트 내용이 있을 때만 내용 설정
      editor.extensionManager.extensions.filter(
        (extension) => extension.name === "placeholder"
      )[0].options["placeholder"] = getContentPlaceholder();

      // 내용 설정 전에 기존 내용 초기화
      editor.commands.clearContent();

      // 약간의 지연 후 내용 설정
      setTimeout(() => {
        editor.commands.setContent(post.contents || "");
      }, 50);
    }
  }, [editor, isOpen, post]);

  useEffect(() => {
    if (fileInfoData && fileInfoData.data) {
      setFiles(fileInfoData.data);
      setOriginalFiles(fileInfoData.data);
    }
  }, [isOpen, fileInfoData]);

  // post가 변경될 때마다 refetch 수행
  useEffect(() => {
    if (isOpen && !!postId && Array.isArray(fileIds) && fileIds.length > 0) {
      refetchFileInfo();
    }
  }, [post, refetchFileInfo, isOpen, fileIds]);

  useEffect(() => {
    if (isOpen && isEditing && !post) {
      alert("알 수 없는 접근!");
      onClose();
    }
  }, [isEditing, isOpen, onClose, post]);

  // 모달이 열리거나 닫힐 때, 그리고 포스트 데이터가 변경될 때의 처리
  useEffect(() => {
    if (isOpen && isEditing && post) {
      const _channelId = id();
      setSelectedChannel(_channelId);
      setPostId(post.id);
      setFileIds(post.file_ids);
      setTitle(post.title);

      // 에디터가 준비되었을 때만 내용 설정
      if (editor) {
        // 내용 설정 시 트랜잭션을 사용하여 상태 변경을 그룹화
        editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false));
      }
    }

    if (!isOpen) {
      setIsLoadPost(false);
      setPostId(null);
      setFileIds(null);

      // 에디터 초기화는 지연 처리
      // 즉시 초기화하지 않고 모달이 닫힌 후에 처리
    }
  }, [id, isEditing, isOpen, post, editor]);

  useEffect(() => {
    if (loading) {
      toast({
        title: "업로드 진행 중",
        description: `업로드 진행률: ${uploadProgress}%`,
        duration: 2000,
        variant: "default",
      });
    }
  }, [uploadProgress]);

  // 글 등록 함수
  const handleSubmit = async (isPublished) => {
    if (fromComponent === "channel") {
      if (!title.trim() || !editor.getHTML().trim() || !selectedChannel) {
        toast({
          title: "입력 오류",
          description: "제목, 내용, 채널은 필수 입력 항목입니다.",
          variant: "destructive",
        });
        return;
      }
    } else if (fromComponent === "organization_question") {
      if (!title.trim() || !editor.getHTML().trim()) {
        toast({
          title: "입력 오류",
          description: "제목, 내용은 필수 입력 항목입니다.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      handleClick(isPublished);
      if (id) {
        const _id = id();
        const timerId = setTimeout(() => {
          // 캐시 초기화
          queryClient.invalidateQueries([fromComponent, _id]);
          clearTimeout(timerId);
        }, 100);
      }

      // 필요하다면 페이지 새로고침 또는 상태 업데이트
    } catch (error) {
      console.error("글 등록 실패:", error);
      toast({
        title: "글 등록 실패",
        description: "글 등록에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫을 때 상태 초기화
  const handleClose = () => {
    // 모달을 닫기만 하고 상태 초기화는 useEffect에서 처리
    onClose();
  };

  // 모달이 닫힐 때 상태 초기화를 처리하는 useEffect
  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫힌 후 상태 초기화
      setTimeout(() => {
        setTitle("");
        setSelectedChannel("");
        setIsSubmitting(false);
        setPreviewImages([]);
        setFiles([]);
        setOriginalFiles([]);
        setRemovedFiles([]);
        setIsLoadPost(false);
        setPostId(null);
        setFileIds(null);

        // 에디터 내용 초기화
        if (editor) {
          editor.commands.clearContent();
        }
      }, 300);
    }
  }, [isOpen, editor]);

  // 2. 새글작성 or 글수정
  const handleClick = async (isPublished) => {
    if (loading) return;

    try {
      setLoading(true);

      // isEditing 으로 수정인지 새글작성인지 구분
      if (isEditing || isLoadPost) {
        try {
          //2-2 수정 실행
          // 변경된 파일만 업로드
          const changedFiles = files.filter(
            (file) =>
              !originalFiles.some((originalFile) => originalFile.id === file.id)
          );
          await sendFileData(changedFiles, userInfo, token, setUploadProgress);

          // 이미지 및 동영상 파일의 ID를 추출하여 데이터 전송
          const fileIds = changedFiles.map((fileInfo) => fileInfo.id);

          // 불러오기 작업 중인 경우, sendTepmPostData 실행
          await sendTempPostData([...fileIds], isPublished);
        } catch (error) {
          console.error("이미지 파일 업로드 및 데이터 전송 에러:", error);
        }
      } else {
        //2-1 새글작성 실행
        // 각 파일에 대한 업로드를 비동기적으로 진행
        for (const fileInfo of files) {
          await sendFileData([fileInfo], userInfo, token, setUploadProgress);
        }
        // 이미지 및 동영상 파일의 ID를 추출하여 데이터 전송
        const fileIds = files.map((fileInfo) => fileInfo.id);

        // 데이터 전송
        await sendPostData([...fileIds], isPublished);

        // noticeStore.setNewPost(true);
      }
    } catch (error) {
      console.error("이미지 파일 업로드 및 데이터 전송 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPostType = () => {
    switch (fromComponent) {
      case "channel":
        return "CHANNEL";
      case "organization":
        return "ORGANIZATION";
      case "organization_question":
        return "QUESTION";
      default:
        return "UNKNOWN";
    }
  };

  const getOwnerId = () => {
    switch (fromComponent) {
      case "channel":
        return selectedChannel;
      case "organization":
      case "organization_question":
        return id ? id() : null;
      default:
        return null;
    }
  };
  // 3-1. 새글작성 api
  const sendPostData = async (fileDataList, isPublishedValue) => {
    const res = await createPost({
      title,
      contents: editor.getHTML(),
      postType: getPostType(),
      ownerId: getOwnerId(),
      authorId: userInfo.userId,
      published: isPublishedValue,
      fileIds: fileDataList,
    });

    if (res.result) {
      if (!fileDataList) {
        // 최종적으로 100%로 설정
        setUploadProgress(100);
      }
      // 성공 시 모달 닫기
      //setLoading(false);
      handleClose();

      toast({
        title: "글 등록 완료",
        description: "게시글이 성공적으로 등록되었습니다.",
        variant: "success",
      });
    } else {
      console.error(res);
      toast({
        title: "글 등록 실패",
        description: "게시글 등록에 실패하었습니다.",
        variant: "error",
      });
    }
  };

  // 3-2. 게시글 수정 api
  const sendTempPostData = async (fileDataList, isPublishedValue) => {
    const postData = {
      id: postId,
      title,
      contents: editor.getHTML(),
      published: isPublishedValue,
      addFileIds: fileDataList,
      deleteFileIds: removedFiles,
    };

    try {
      const res = await updatePost(postData);
      if (res.result) {
        if (!fileDataList) {
          // 최종적으로 100%로 설정
          setUploadProgress(100);
        }
        // 성공 시 모달 닫기
        setLoading(false);
        handleClose();

        toast({
          title: "글 수정 완료",
          description: "게시글이 성공적으로 수정되었습니다.",
          variant: "success",
        });
      } else {
        console.error(res);
        toast({
          title: "글 수정 실패",
          description: "게시글 수정에 실패하었습니다.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("게시글 수정 에러:", error);
      toast({
        title: "글 수정 실패",
        description: "게시글 수정에 실패하었습니다.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 파일 선택 시 실행
  const handleFileChange = async (e) => {
    const _files = Array.from(e.target.files); // 선택된 파일 배열로 변환
    const maxFileSize = 50 * 1024 * 1024; // 파일 개별 최대 크기: 50MB
    const maxTotalSize = 10 * 1024 * 1024; // 문서 총 크기: 10MB
    const maxFileCount = 5; // 문서 최대 개수
    const maxImageCount = 50; // 이미지 최대 개수
    const maxVideoCount = 5; // 동영상 최대 개수

    // 파일 분류
    const images = _files.filter((file) => file.type.startsWith("image/"));
    const videos = _files.filter((file) => file.type.startsWith("video/"));
    const documents = _files.filter(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/")
    );

    // 현재 선택된 파일 개수
    const currentImageCount = files.filter((file) =>
      file.type.startsWith("image")
    ).length;
    const currentVideoCount = files.filter((file) =>
      file.type.startsWith("video")
    ).length;
    const currentDocumentFileInfos = files.filter(
      (file) => !file.type.startsWith("image") && !file.type.startsWith("video")
    );
    const currentDocumentCount = currentDocumentFileInfos.length;
    const currentDocumentSize = currentDocumentFileInfos.reduce(
      (sum, file) => sum + file.file.size,
      0
    );

    // 1. 파일 개수 조건 먼저 확인
    if (
      currentImageCount + currentVideoCount + images.length + videos.length >
      maxImageCount
    ) {
      alert("사진과 동영상은 최대 50개까지 첨부 가능합니다.");
      return;
    }
    if (currentVideoCount + videos.length > maxVideoCount) {
      alert("동영상은 최대 5개까지 선택 가능합니다.");
      return;
    }
    if (
      currentDocumentCount + documents.length > maxFileCount ||
      currentDocumentSize +
        documents.reduce((sum, file) => sum + file.size, 0) >
        maxTotalSize
    ) {
      alert("파일은 최대 5개까지, 총 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 유효한 파일 배열
    const validImages = [];
    const validVideos = [];
    const validDocuments = [];

    // 2. 이미지 처리
    for (const file of images) {
      if (file.size > maxFileSize) {
        alert(`이미지 "${file.name}"의 크기는 50MB 이하여야 합니다.`);
        continue;
      }
      validImages.push(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImages((prev) => [...prev, { url: previewUrl, file }]);
    }

    // 3. 동영상 처리
    for (const file of videos) {
      if (file.size > maxFileSize) {
        alert(`동영상 "${file.name}"의 크기는 50MB 이하여야 합니다.`);
        continue;
      }
      validVideos.push(file);
    }

    // 4. 문서 파일 처리
    for (const file of documents) {
      if (file.size > maxFileSize) {
        alert(`문서 "${file.name}"의 크기는 50MB 이하여야 합니다.`);
        continue;
      }
      validDocuments.push(file);
    }

    // 5. 파일 추가 처리
    if (validImages.length > 0) {
      await handleImageFileChange(validImages, setFiles);
    }
    if (validVideos.length > 0) {
      await handleVideoFileChange(validVideos, setFiles);
    }
    if (validDocuments.length > 0) {
      await handleDocumentChange(validDocuments, setFiles);
    }

    e.target.value = null; // 파일 입력 초기화
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (index) => {
    const newRemovedFiles = [...removedFiles];
    newRemovedFiles.push(files[index].id);
    setRemovedFiles(newRemovedFiles);

    // 삭제할 파일의 URL을 찾아서 미리보기 이미지 목록에서 제거
    const fileToRemove = files[index];
    if (fileToRemove && fileToRemove.file) {
      // previewImages에서 해당 file과 일치하는 객체를 찾기
      setPreviewImages((prev) => {
        const newPreviewImages = prev.filter(
          (item) => item.file !== fileToRemove.file
        );
        // 제거되는 파일의 URL을 revokeObjectURL로 해제
        prev.forEach((item) => {
          if (item.file === fileToRemove.file) {
            URL.revokeObjectURL(item.url);
          }
        });
        return newPreviewImages;
      });
    }

    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.target.files = e.dataTransfer.files;
      handleFileChange(e);
    }
  };

  const getComponentTitle = () => {
    switch (fromComponent) {
      case "channel":
      case "organization":
        if (isEditing) {
          return "글수정";
        } else {
          return "글쓰기";
        }
      case "organization_question":
        if (isEditing) {
          return "질문수정";
        } else {
          return "질문하기";
        }
      default:
        return "???";
    }
  };

  const getTitlePlaceholder = () => {
    switch (fromComponent) {
      case "channel":
      case "organization":
        return "제목을 입력해주세요.";
      case "organization_question":
        return "어떤 내용이 궁금하신가요?";
      default:
        return "???";
    }
  };

  // 언어 레이블 가져오기
  const getLanguageLabel = () => {
    const lang = LANGUAGES.find((l) => l.value === selectedLanguage);
    return lang ? lang.label : "Select Language";
  };

  // 언어 변경 처리
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setIsDropdownOpen(false);
  };

  // 유튜브 URL 추가 함수 - 완전히 새로 작성
  const addYoutubeVideo = () => {
    if (!youtubeUrl) {
      toast({
        title: "입력 오류",
        description: "유튜브 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    let videoId = "";
    // 정규식으로 유튜브 ID 추출
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    videoId = match && match[7].length === 11 ? match[7] : null;

    // 정규식으로 추출 실패 시 URL 파싱 시도
    if (!videoId) {
      try {
        const url = new URL(youtubeUrl);
        if (url.hostname === "youtu.be") {
          videoId = url.pathname.substring(1);
        } else if (url.hostname.includes("youtube.com")) {
          videoId = url.searchParams.get("v");
        }
      } catch (error) {
        console.error("URL 파싱 오류:", error);
      }
    }

    if (!videoId) {
      toast({
        title: "입력 오류",
        description: "유튜브 URL에서 비디오 ID를 추출할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    // 유튜브 동영상 삽입 시도
    if (editor) {
      try {
        // 유튜브 확장을 사용하여 삽입
        const youtubeHTML = `\n\n <div data-youtube-video><iframe width="640" height="480" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div> \n\n`;
        editor.commands.insertContent(youtubeHTML);
        // editor.commands.setContent(post.contents + youtubeHTML);
        console.log("유튜브 동영상 삽입 성공:", youtubeHTML);
        // 모달 닫기
        setIsYoutubeModalOpen(false);
        setYoutubeUrl("");

        toast({
          title: "동영상 추가 완료",
          description: "유튜브 동영상이 성공적으로 추가되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("YouTube 비디오 추가 오류:", error);

        // 직접 HTML 삽입 시도 (대체 방법)
        try {
          const youtubeHTML = `\n\n <div data-youtube-video><iframe width="640" height="480" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div> \n\n`;
          editor.commands.insertContent(youtubeHTML);

          setIsYoutubeModalOpen(false);
          setYoutubeUrl("");

          toast({
            title: "동영상 추가 완료",
            description: "유튜브 동영상이 성공적으로 추가되었습니다.",
            variant: "success",
          });
        } catch (fallbackError) {
          console.error("HTML 직접 삽입 오류:", fallbackError);
          setIsYoutubeModalOpen(false);
          setYoutubeUrl("");

          toast({
            title: "동영상 추가 실패",
            description: "유튜브 동영상을 추가하는 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      }
    }
  };

  // 유튜브 아이콘 클릭 시 모달 표시 함수
  const handleYoutubeIconClick = () => {
    // 유튜브 URL 입력 모달 표시
    setIsYoutubeModalOpen(true);
  };

  const [activeIndex, setActiveIndex] = useState(0);

  const removePreviewImage = (index) => {
    // 삭제할 이미지의 URL 객체 해제
    if (previewImages[index] && previewImages[index].url) {
      URL.revokeObjectURL(previewImages[index].url);
    }

    // 삭제할 이미지의 파일 객체 찾기
    const fileToRemove = previewImages[index].file;

    // previewImages에서 해당 이미지 제거
    setPreviewImages((prev) => {
      const newPreviewImages = [...prev];
      newPreviewImages.splice(index, 1);

      // activeIndex 조정
      if (newPreviewImages.length === 0) {
        // 이미지가 더 이상 없으면 activeIndex를 0으로 리셋
        setActiveIndex(0);
      } else if (index === activeIndex) {
        // 현재 활성화된 이미지를 삭제한 경우
        // 같은 위치에 다른 이미지가 없으면 마지막 이미지로 이동
        setActiveIndex(Math.min(index, newPreviewImages.length - 1));
      } else if (index < activeIndex) {
        // 현재 활성화된 이미지보다 앞에 있는 이미지를 삭제한 경우
        // activeIndex를 1 감소시킴
        setActiveIndex((prev) => prev - 1);
      }

      return newPreviewImages;
    });

    // files 배열에서도 해당 파일 제거
    if (fileToRemove) {
      setFiles((prev) => {
        const fileIndex = prev.findIndex(
          (f) => (f.file && f.file === fileToRemove) || f === fileToRemove
        );
        if (fileIndex !== -1) {
          const newFiles = [...prev];
          newFiles.splice(fileIndex, 1);
          return newFiles;
        }
        return prev;
      });
    }
  };

  const [isFileListVisible, setIsFileListVisible] = useState(true);

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // 모달이 닫힐 때만 처리
            onClose();
          }
        }}
        className="bg-black/70"
      >
        <DialogContent
          className={clsx(
            "z-80 p-0 h-full lg:h-[90vh] overflow-auto flex flex-col lg:flex-row border-none shadow-none lg:rounded-xl",
            "lg:max-w-[1300px]"
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{getComponentTitle()}</DialogTitle>
            <DialogDescription>게시글 작성 및 수정 폼입니다.</DialogDescription>
          </DialogHeader>
          {!isMobile && (
            <div className="bg-gray-100 border-r hidden lg:block lg:w-[600px]">
              <div className="h-full flex items-center justify-center bg-black">
                {previewImages.length > 0 ? (
                  <div className="bg-gray-100 border-r hidden lg:block lg:w-[600px]">
                    <div className="h-full flex items-center justify-center">
                      <MediaContentComponent
                        previewImages={previewImages}
                        removePreviewImage={removePreviewImage}
                      />
                    </div>
                  </div>
                ) : fileIds && fileIds.length > 0 ? (
                  <>
                    {/* 왼쪽 이미지 섹션 (인스타그램 스타일) */}
                    <div className="w-full lg:w-[600px] h-[50vh] lg:h-full bg-black flex items-center justify-center">
                      <MediaContentComponent2
                        postId={postId}
                        fileIds={fileIds}
                        setSelectedImage={setSelectedImage}
                        setIsImageViewerOpen={setIsImageViewerOpen}
                        removeFile={(fileId) => {
                          // 삭제할 파일 ID를 removedFiles에 추가
                          setRemovedFiles((prev) => [...prev, fileId]);

                          // fileIds에서 해당 ID 제거
                          setFileIds((prev) =>
                            prev.filter((id) => id !== fileId)
                          );
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-400">
                    <ImageIcon
                      width="48"
                      height="48"
                      className="mb-3 opacity-60"
                    />
                    <p className="text-sm font-medium">이미지가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#dbdbdb] h-[65px]">
              <h2 className="flex h-[65px] justify-center text-center items-center font-semibold text-lg">
                {getComponentTitle()}
              </h2>
            </div>
            <div className="flex flex-row h-[calc(100%-65px)]">
              <div className="w-full lg:w-[700px] flex flex-col h-auto lg:h-full bg-white">
                <div className="px-4 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-auto max-h-[700px] sm:h-[75vh] sm:max-h-[677px]">
                  {fromComponent === "channel" && !isEditing && (
                    <Select
                      value={selectedChannel}
                      onValueChange={setSelectedChannel}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="채널을 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent className="z-[90]">
                        {!channelIsLoading &&
                          channelData &&
                          channelData?.data.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.channelName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  {/* 제목 입력 */}
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={getTitlePlaceholder()}
                    maxLength={100}
                    className="border-0 border-b rounded-none px-0 h-12 text-sm placeholder:text-gray-400"
                  />
                  {/* 내용 입력 */}
                  <EditorContent
                    className="text-sm placeholder:text-gray-400 no-ring pt-3 custom-editor-style"
                    editor={editor}
                    style={{ flexGrow: 1 }}
                  />

                  {/* 첨부 파일 */}
                  {postId && fileIds && (
                    <FilesListComponent postId={postId} fileIds={fileIds} />
                  )}
                </div>
                {files.length > 0 && (
                  <div className="bg-white border-t border-gray-200 w-full fixed lg:relative bottom-[6vh] lg:bottom-0 left-0">
                    <div
                      className="flex items-center justify-between px-4 py-2 cursor-pointer border-b border-gray-200 bg-white"
                      onClick={() => setIsFileListVisible(!isFileListVisible)}
                    >
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        첨부된 파일 ({files.length})
                      </p>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 ${
                          isFileListVisible ? "" : "rotate-180"
                        }`}
                      />
                    </div>
                    <div
                      className={`transition-all duration-300 overflow-y-auto bg-white`}
                      style={{
                        maxHeight: isFileListVisible ? "30vh" : "0",
                        overscrollBehavior: "contain",
                      }}
                    >
                      <div className="p-4 space-y-2">
                        {files.map((_file, index) => {
                          const file = _file.file || _file;
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-navy-700 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400"
                              >
                                &times;
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <div className="px-4 py-2 border-t border-[#dbdbdb] h-[6vh] flex items-center justify-between lg:relative fixed bottom-0 left-0 right-0 bg-white z-50">
                  <div className="flex items-center h-10 gap-6">
                    <button className="text-gray-600">
                      <ImageIcon
                        className="cursor-pointer w-6 h-6"
                        onClick={() =>
                          document.getElementById("media-upload").click()
                        }
                      />
                      <input
                        id="media-upload"
                        type="file"
                        accept="image/*, video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </button>
                    <button className="text-gray-600">
                      <Paperclip
                        className="cursor-pointer w-6 h-6"
                        onClick={() =>
                          document.getElementById("file-upload2").click()
                        }
                      />
                      <input
                        id="file-upload2"
                        type="file"
                        accept={allowedExtensions2}
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </button>

                    {/* Youtube 버튼 수정 - 모달 표시 */}
                    <button
                      className="text-gray-600"
                      onClick={handleYoutubeIconClick}
                    >
                      <YoutubeIcon className="cursor-pointer w-6 h-6" />
                    </button>
                    <button
                      className="text-gray-600"
                      onClick={() => {
                        // 코드 블록 추가
                        if (editor) {
                          editor
                            .chain()
                            .focus()
                            .toggleCodeBlock({ language: "javascript" })
                            .enter()
                            .run();
                        }
                      }}
                    >
                      <Code
                        className="cursor-pointer w-6 h-6"
                        title="코드 블록 추가 (JavaScript)"
                      />
                    </button>
                  </div>
                  <Button
                    onClick={(e) => {
                      handleSubmit(true);
                    }}
                    disabled={isSubmitting}
                    className="cursor-pointer bg-navy-600 text-white hover:bg-navy-700 dark:bg-bg-navy-500 dark:hover:bg-navy-600 dark:text-white ml-2"
                  >
                    {isEditing ? "수정하기" : "등록하기"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isYoutubeModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsYoutubeModalOpen(false);
            setYoutubeUrl("");
          }
        }}
      >
        <DialogContent2 className="sm:max-w-[500px] z-[100]">
          <DialogHeader>
            <DialogTitle>유튜브 동영상 추가</DialogTitle>
            <DialogDescription>
              추가하려는 유튜브 동영상의 URL을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              className="w-full"
              // Enter 키 입력 시 동영상 추가 처리
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addYoutubeVideo();
                }
              }}
            />
            <p className="mt-2 text-xs text-gray-500">
              예시: https://www.youtube.com/watch?v=dQw4w9WgXcQ 또는
              https://youtu.be/dQw4w9WgXcQ
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsYoutubeModalOpen(false);
                setYoutubeUrl("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                addYoutubeVideo();
              }}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent2>
      </Dialog>
      {isImageViewerOpen && selectedImage && (
        <ImageViewerModal
          imageUrl={selectedImage}
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
    </>
  );
}

const MediaContentComponent2 = ({
  postId,
  fileIds,
  setSelectedImage,
  setIsImageViewerOpen,
  removeFile,
}) => {
  const [images, setImages] = useState(null);
  const [videos, setVideos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { useGetAllFilesInfo } = useFileApi();
  const { data: res, isLoading, error } = useGetAllFilesInfo(postId, fileIds);

  useEffect(() => {
    if (!isLoading) {
      const data = res?.data;
      const images = data?.filter((file) => file.type === "image");
      const videos = data?.filter((file) => file.type === "video");
      setImages(images);
      setVideos(videos);
    }
  }, [isLoading]);

  // 이미지 및 비디오를 모두 포함하는 전체 미디어 배열
  const allMedia = [...(images || []), ...(videos || [])];

  const handleNext = () => {
    if (allMedia.length > 1) {
      setActiveIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
    }
  };

  const handlePrev = () => {
    if (allMedia.length > 1) {
      setActiveIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
    }
  };

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
    );
  }

  return (
    <div className="relative w-full h-full">
      {allMedia.length > 0 && (
        <div className="w-full h-full relative">
          {allMedia.map((media, index) => (
            <div
              key={media.id}
              className={`absolute w-full h-full transition-opacity duration-300 ${
                index === activeIndex
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {media.type === "image" ? (
                <div
                  className="w-full h-full cursor-pointer"
                  onClick={() => {
                    setSelectedImage(media?.address);
                    setIsImageViewerOpen(true);
                  }}
                >
                  <button
                    className="absolute top-2 right-2 z-10 bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-black/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("이 이미지를 삭제하시겠습니까?")) {
                        // 현재 인덱스 저장
                        const currentIndex = activeIndex;

                        // 파일 삭제 처리
                        removeFile(media.id);

                        // 삭제 후 남은 미디어 수에 따라 activeIndex 조정
                        if (allMedia.length <= 1) {
                          // 마지막 이미지를 삭제한 경우
                          setActiveIndex(0);
                        } else if (currentIndex === allMedia.length - 1) {
                          // 마지막 이미지였다면 이전 이미지로 이동
                          setActiveIndex(currentIndex - 1);
                        }
                        // 그 외의 경우 현재 인덱스를 유지 (다음 이미지가 현재 위치로 이동)
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <ImageWithFallback
                    src={media?.address || "/placeholder.svg"}
                    alt={media?.name}
                    className="w-full h-full object-contain max-h-[80vh]"
                    quality={85}
                    fallbackSrc="/placeholder.svg?height=600&width=600"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    controls
                    className="max-w-full max-h-full"
                    preload="metadata"
                  >
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
  );
};

const MediaContentComponent = ({ previewImages, removePreviewImage }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % previewImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? previewImages.length - 1 : prevIndex - 1
    );
  };

  if (!previewImages || previewImages.length === 0) {
    return <div>No images to display</div>;
  }

  return (
    <div className="relative w-full h-full">
      {previewImages.length > 0 && (
        <div className="w-full h-full relative">
          <div className="w-full h-full cursor-pointer">
            <button
              className="absolute top-2 right-2 z-10 bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("이 이미지를 삭제하시겠습니까?")) {
                  removePreviewImage(activeIndex);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img
              src={previewImages[activeIndex]?.url || "/placeholder.svg"}
              alt={`미리보기 ${activeIndex + 1}`}
              className="object-contain w-full h-full max-h-[80vh]"
            />
          </div>

          {previewImages.length > 1 && (
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
  );
};

// 파일 목록 컴포넌트 - 인스타그램 스타일
const FilesListComponent = ({ postId, fileIds }) => {
  const [files, setFiles] = useState(null);

  const { useGetAllFilesInfo } = useFileApi();
  const { data: res, isLoading, error } = useGetAllFilesInfo(postId, fileIds);

  useEffect(() => {
    if (!isLoading) {
      const data = res?.data;
      const files = data?.filter((file) => file.type === "file");
      if (files?.length > 0) {
        setFiles(files);
      }
    }
  }, [isLoading]);

  return (
    <>
      {files && files.length > 0 && (
        <div className="mt-3 bg-[#fafafa] rounded-md p-3 border border-[#efefef]">
          <div className="text-xs font-medium text-[#8e8e8e] mb-1.5">
            첨부 파일
          </div>
          {files.map((file) => (
            <a
              key={file.id}
              href={file.address}
              download={file.name}
              className="flex items-center gap-2 text-sm text-[#0095f6] py-1.5 hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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
  );
};
