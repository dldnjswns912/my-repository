import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// 10MB 임계값 설정 (바이트 단위)
const FILE_SIZE_THRESHOLD = 300 * 1024 * 1024;

export const useFileApi = () => {
  const {
    useGet,
    usePost,
    usePut,
    useDelete,
    usePostQuery,
    fetchGet,
    getAxiosWithToken,
  } = useAxiosQuery();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // 파일 다운로드
  const downloadFileMutation = usePost({
    responseType: "arraybuffer",
  });

  // 파일 업로드 (일반)
  const uploadFileMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // Presigned URL 생성 - 객체가 아닌 실제 함수 호출로 변경
  const generatePresignedUrlMutation = usePost();

  // Presigned URL 업로드 성공 처리
  const handleUploadSuccessMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // 오디오 업로드
  const uploadAudioMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // 이미지 업로드
  const uploadImageMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // 파일 업로드 (일반 파일)
  const uploadGenericFileMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // 이미지 링크 조회 - GET 메서드 대신 POST 메서드 사용
  const getImageLinkMutation = usePost();

  // ID로 파일 조회
  const findFilesByIdMutation = usePost();

  // 파일 삭제
  const deleteFileMutation = useDelete({
    onSuccess: () => {
      queryClient.invalidateQueries(["files"]);
    },
  });

  // 파일 다운로드 함수
  const downloadFile = useCallback(
    (fileDto) => {
      return getAxiosWithToken().post("/v2/file/download", fileDto, {
        responseType: "arraybuffer",
      });
      // return getAxiosWithToken().post({
      //   endPoint: "/v2/file/download",
      //   data: fileDto,
      // });
    },
    [downloadFileMutation]
  );

  // 일반 파일 업로드 함수
  const uploadFile = useCallback(
    async (file, options = {}) => {
      const { index, width, height, ownerId, memberType } = options;

      // 파일 크기가 임계값보다 큰 경우 presigned URL 사용
      if (file.size > FILE_SIZE_THRESHOLD) {
        return uploadLargeFile(file, options);
      }

      const formData = new FormData();
      formData.append("file", file);

      return uploadFileMutation.mutateAsync({
        endPoint: "/v2/file",
        data: formData,
        params: { index, width, height, ownerId, memberType },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    [uploadFileMutation]
  );

  // 대용량 파일 업로드 (Presigned URL 사용)
  const uploadLargeFile = useCallback(
    async (file, options = {}) => {
      const { ownerId, memberType } = options;

      try {
        // 업로드 시작 로그
        console.log(
          "파일 업로드 시작:",
          file.name,
          "크기:",
          file.size,
          "타입:",
          file.type
        );
        setUploadProgress(0);

        // 1. Presigned URL 요청
        const presignedResponse = await fetchGet(
          `/v2/file/upload/${file.name}`
        );

        console.log("Presigned URL 응답:", presignedResponse);

        if (!presignedResponse?.data) {
          throw new Error("Presigned URL 생성 실패");
        }

        const { url, key } = presignedResponse.data;
        console.log("업로드 URL:", url);
        console.log("파일 키:", key);

        const uploadResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file, // 파일 객체를 직접 전송
        });

        if (!uploadResponse.ok) {
          console.error(
            "S3 업로드 실패:",
            uploadResponse.status,
            uploadResponse.statusText
          );
          const errorText = await uploadResponse.text();
          console.error("S3 오류 응답:", errorText);
          throw new Error(
            `파일 업로드 실패: ${uploadResponse.status} ${uploadResponse.statusText}`
          );
        }

        console.log("S3 업로드 성공!", uploadResponse);

        // 응답 헤더 확인
        const headers = {};
        uploadResponse.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("응답 헤더:", headers);

        // 진행 상태 100%로 설정
        setUploadProgress(100);

        // 3. 업로드 성공 알림
        const fileInfo = {
          name: file.name,
          type: getFileType(file.type),
          key: key,
          address: url.split("?")[0], // URL에서 쿼리 파라미터 제거
          width: options.width || 0,
          height: options.height || 0,
          index: options.index || 0,
          size: file.size,
        };

        console.log("서버에 전송할 파일 정보:", fileInfo);

        const successResponse = await handleUploadSuccessMutation.mutateAsync({
          endPoint: "/v2/file/upload/success",
          data: fileInfo,
          params: {
            ownerId,
            memberType,
          },
        });

        console.log("업로드 성공 처리 응답:", successResponse);

        // 완료 후 진행 상태 초기화
        setUploadProgress(0);
        return successResponse;
      } catch (error) {
        console.error("파일 업로드 중 오류 발생:", error);
        setUploadProgress(0);
        throw error;
      }
    },
    [generatePresignedUrlMutation, handleUploadSuccessMutation]
  );

  // 오디오 파일 업로드
  const uploadAudio = useCallback(
    (file, ownerId, memberType) => {
      const formData = new FormData();
      formData.append("file", file);

      return uploadAudioMutation.mutateAsync({
        endPoint: "/v2/file/upload-audio",
        data: formData,
        params: { ownerId, memberType },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    [uploadAudioMutation]
  );

  // 이미지 업로드
  const uploadImage = useCallback(
    (file, ownerId, memberType) => {
      const formData = new FormData();
      formData.append("file", file);

      return uploadImageMutation.mutateAsync({
        endPoint: "/v2/file/upload-image",
        data: formData,
        params: { ownerId, memberType },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    [uploadImageMutation]
  );

  // 일반 파일 업로드
  const uploadGenericFile = useCallback(
    (file, ownerId, memberType) => {
      const formData = new FormData();
      formData.append("file", file);

      return uploadGenericFileMutation.mutateAsync({
        endPoint: "/v2/file/upload-file",
        data: formData,
        params: { ownerId, memberType },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    [uploadGenericFileMutation]
  );

  // 이미지 링크 조회 - POST 방식으로 변경
  const getImageLink = useCallback(
    (fileId) => {
      return getImageLinkMutation.mutateAsync({
        endPoint: `/v2/file/imagelink/${fileId}`,
        method: "GET", // GET 요청이지만 usePost를 통해 호출
      });
    },
    [getImageLinkMutation]
  );

  // ID로 여러 파일 정보 조회
  const findFilesById = useCallback(
    (fileIds) => {
      return findFilesByIdMutation.mutateAsync({
        endPoint: "/v2/file/findAll",
        data: fileIds,
      });
    },
    [findFilesByIdMutation]
  );

  // 파일 삭제
  const deleteFile = useCallback(
    (fileId) => {
      return deleteFileMutation.mutateAsync({
        endPoint: `/v2/file/${fileId}`,
      });
    },
    [deleteFileMutation]
  );

  // 파일 타입 결정 헬퍼 함수
  const getFileType = (mimeType) => {
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType.startsWith("audio/")) {
      return "audio";
    } else if (mimeType.startsWith("video/")) {
      return "video";
    } else {
      return "file";
    }
  };

  // 이미지 URL 생성 헬퍼 함수
  const getImageUrl = useCallback((fileId) => {
    if (!fileId) return "";
    return `/v2/file/image/${fileId}`;
  }, []);

  // 특정 크기의 이미지 URL 생성 헬퍼 함수
  const getResizedImageUrl = useCallback((fileId, size) => {
    if (!fileId) return "";
    return `/v2/file/image/${fileId}/${size}`;
  }, []);

  // 특정 항목 이미지 URL 헬퍼 함수들
  const getUserImageUrl = useCallback((userId) => {
    if (!userId) return "";
    return `/v2/file/image/user/${userId}`;
  }, []);

  const getMemberImageUrl = useCallback((memberId) => {
    if (!memberId) return "";
    return `/v2/file/image/member/${memberId}`;
  }, []);

  const getSchoolImageUrl = useCallback((schoolId) => {
    if (!schoolId) return "";
    return `/v2/file/image/school/${schoolId}`;
  }, []);

  const getKidImageUrl = useCallback((kidId) => {
    if (!kidId) return "";
    return `/v2/file/image/kid/${kidId}`;
  }, []);

  const useGetAllFilesInfo = (postId, fileIds, options = {}) => {
    return usePostQuery(
      ["posts", "detail", postId, "files"],
      `/v2/file/findAll`,
      fileIds,
      {},
      options
    );
  };

  return {
    // 파일 다운로드
    downloadFile,

    // 파일 업로드 함수들
    uploadFile,
    uploadLargeFile,
    uploadAudio,
    uploadImage,
    uploadGenericFile,

    // 파일 검색/관리 함수들
    getImageLink,
    findFilesById,
    deleteFile,
    useGetAllFilesInfo,

    // URL 생성 헬퍼 함수들
    getImageUrl,
    getResizedImageUrl,
    getUserImageUrl,
    getMemberImageUrl,
    getSchoolImageUrl,
    getKidImageUrl,

    // 상태들
    uploadProgress,
    isUploading:
      uploadFileMutation.isLoading ||
      uploadAudioMutation.isLoading ||
      uploadImageMutation.isLoading ||
      uploadGenericFileMutation.isLoading,
    isDownloading: downloadFileMutation.isLoading,
    isDeleting: deleteFileMutation.isLoading,
  };
};
