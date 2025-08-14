// fileUploadService.js
import { useAxiosQuery } from '@/hooks/useAxiosQuery';
import { toast } from 'sonner';

// 파일 업로드 관련 API 엔드포인트
const API_ENDPOINTS = {
  GENERATE_PRESIGNED_URL: '/v2/file/upload', // Presigned URL 발급
  UPLOAD_SUCCESS: '/v2/file/upload/success', // 업로드 성공 처리
  UPLOAD_IMAGE: '/v2/file/upload-image', // 직접 이미지 업로드
  UPLOAD_FILE: '/v2/file/upload-file', // 직접 파일 업로드
  UPLOAD_AUDIO: '/v2/file/upload-audio', // 직접 오디오 업로드
  GET_IMAGE: '/v2/file/image', // 이미지 조회
};

export const useFileUploadService = () => {
  const { fetchGet, fetchPost } = useAxiosQuery();

  /**
   * Presigned URL 발급 요청
   * @param {string} fileName - 업로드할 파일 이름
   * @returns {Promise<Object>} Presigned URL 정보
   */
  const generatePresignedUrl = async (fileName) => {
    try {
      if (!fileName) {
        throw new Error('파일 이름이 없습니다.');
      }

      const response = await fetchGet(`${API_ENDPOINTS.GENERATE_PRESIGNED_URL}/${encodeURIComponent(fileName)}`);
      
      if (response && response.data) {
        return response.data;
      }

      throw new Error('Presigned URL 발급에 실패했습니다.');
    } catch (error) {
      console.error('Presigned URL 발급 오류:', error);
      toast.error(error.message || 'Presigned URL 발급에 실패했습니다.');
      throw error;
    }
  };

  /**
   * Presigned URL을 통한 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {string} presignedUrl - 발급받은 Presigned URL
   * @returns {Promise<boolean>} 업로드 성공 여부
   */
  const uploadToPresignedUrl = async (file, presignedUrl) => {
    try {
      if (!file || !presignedUrl) {
        throw new Error('파일 또는 Presigned URL이 없습니다.');
      }

      // Presigned URL에 직접 PUT 요청으로 파일 업로드
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.ok) {
        return true;
      }

      throw new Error(`파일 업로드에 실패했습니다. 상태 코드: ${response.status}`);
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error(error.message || '파일 업로드에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 업로드 성공 처리
   * @param {Object} fileInfo - 파일 정보 (key, name, type 등)
   * @param {string} ownerId - 파일 소유자 ID
   * @param {string} memberType - 소유자 타입 (USER, MEMBER 등)
   * @returns {Promise<Object>} 저장된 파일 정보
   */
  const handleUploadSuccess = async (fileInfo, ownerId, memberType = 'USER') => {
    try {
      if (!fileInfo || !fileInfo.key) {
        throw new Error('파일 정보가 없습니다.');
      }

      const requestData = {
        ...fileInfo,
      };

      const params = {};
      if (ownerId) params.ownerId = ownerId;
      if (memberType) params.memberType = memberType;

      const response = await fetchPost(API_ENDPOINTS.UPLOAD_SUCCESS, requestData, params);
      
      if (response.result && response.response.data) {
        return response.response.data;
      }

      throw new Error('파일 업로드 완료 처리에 실패했습니다.');
    } catch (error) {
      console.error('파일 업로드 완료 처리 오류:', error);
      toast.error(error.message || '파일 업로드 완료 처리에 실패했습니다.');
      throw error;
    }
  };

  /**
   * Presigned URL 방식으로 파일 업로드 (전체 과정)
   * @param {File} file - 업로드할 파일
   * @param {Object} options - 업로드 옵션 (ownerId, memberType 등)
   * @returns {Promise<Object>} 업로드된 파일 정보
   */
  const uploadFileWithPresignedUrl = async (file, options = {}) => {
    try {
      if (!file) {
        throw new Error('파일이 없습니다.');
      }

      const { ownerId = '', memberType = 'USER' } = options;
      
      // 1. Presigned URL 발급
      const presignedUrlInfo = await generatePresignedUrl(file.name);
      
      // 2. Presigned URL에 파일 업로드
      await uploadToPresignedUrl(file, presignedUrlInfo.url);
      
      // 파일 정보 구성
      let fileType = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      }
      
      // 파일 크기 및 차원 정보
      let width = 0;
      let height = 0;
      
      if (fileType === 'image') {
        // 이미지 파일의 경우 크기 정보 추출
        const imageInfo = await getImageDimensions(file);
        width = imageInfo.width;
        height = imageInfo.height;
      }
      
      // 3. 업로드 성공 처리
      const fileInfo = {
        key: presignedUrlInfo.key,
        name: file.name,
        type: fileType,
        width,
        height,
        size: file.size,
        index: 0,
        isActive: true,
        thumbnail_key: presignedUrlInfo.key, // 기본적으로 동일한 키 사용
        duration: 0
      };
      
      const result = await handleUploadSuccess(fileInfo, ownerId, memberType);
      return result;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error(error.message || '파일 업로드에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 이미지 파일의 크기(width, height) 얻기
   * @param {File} imageFile - 이미지 파일
   * @returns {Promise<Object>} 이미지 크기 정보
   */
  const getImageDimensions = (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('이미지 크기를 가져오는데 실패했습니다.'));
      };
      img.src = URL.createObjectURL(imageFile);
    });
  };

  /**
   * 기존 방식으로 이미지 파일 업로드 (멀티파트)
   * @param {File} file - 업로드할 이미지 파일
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Object>} 업로드된 이미지 정보
   */
  const uploadImage = async (file, options = {}) => {
    try {
      if (!file) {
        throw new Error('파일이 없습니다.');
      }

      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일이 아닙니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // 기본 옵션 설정
      const { ownerId = '', memberType = 'USER' } = options;
      formData.append('ownerId', ownerId);
      formData.append('memberType', memberType);
      
      // 추가 옵션이 있는 경우 FormData에 추가
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'ownerId' && key !== 'memberType') {
          formData.append(key, value);
        }
      });

      // API 호출
      const response = await fetchPost(API_ENDPOINTS.UPLOAD_IMAGE, formData, {}, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.result && response.response.data) {
        return response.response.data;
      }

      throw new Error('이미지 업로드에 실패했습니다.');
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error(error.message || '이미지 업로드에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 기존 방식으로 일반 파일 업로드 (멀티파트)
   * @param {File} file - 업로드할 파일
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Object>} 업로드된 파일 정보
   */
  const uploadFile = async (file, options = {}) => {
    try {
      if (!file) {
        throw new Error('파일이 없습니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // 기본 옵션 설정
      const { ownerId = '', memberType = 'USER' } = options;
      formData.append('ownerId', ownerId);
      formData.append('memberType', memberType);
      
      // 추가 옵션이 있는 경우 FormData에 추가
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'ownerId' && key !== 'memberType') {
          formData.append(key, value);
        }
      });

      // API 호출
      const response = await fetchPost(API_ENDPOINTS.UPLOAD_FILE, formData, {}, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.result && response.response.data) {
        return response.response.data;
      }

      throw new Error('파일 업로드에 실패했습니다.');
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error(error.message || '파일 업로드에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 여러 파일 업로드
   * @param {FileList|Array<File>} files - 업로드할 파일들
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Array<Object>>} 업로드된 파일들의 정보
   */
  const uploadMultipleFiles = async (files, options = {}) => {
    try {
      if (!files || files.length === 0) {
        throw new Error('업로드할 파일이 없습니다.');
      }

      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(file => {
        // Presigned URL 방식으로 업로드
        return uploadFileWithPresignedUrl(file, options)
          .then(result => ({
            ...result,
            originalFile: file,
            type: file.type.startsWith('image/') ? 'image' : 'file'
          }));
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('다중 파일 업로드 오류:', error);
      toast.error(error.message || '파일 업로드에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 파일 ID로 이미지 URL 가져오기
   * @param {string} fileId - 파일 ID
   * @returns {string} 이미지 URL
   */
  const getImageUrl = (fileId) => {
    if (!fileId) return '';
    return `${API_ENDPOINTS.GET_IMAGE}/${fileId}`;
  };

  return {
    generatePresignedUrl,
    uploadToPresignedUrl,
    handleUploadSuccess,
    uploadFileWithPresignedUrl,
    uploadImage,
    uploadFile,
    uploadMultipleFiles,
    getImageUrl,
    getImageDimensions
  };
};