import axiosReal from "axios";

// 이미지 파일 선택 시 실행
export const handleImageFileChange = async (files, setFiles) => {
  const currentIndex = getCurrentIndex(files);

  // 파일이 배열인지 확인하고, 배열이 아니면 배열로 변환
  const imageFiles = Array.isArray(files) ? files : [files];

  const filesInfo = await Promise.all(imageFiles.map(async (file, index) => {
    if (!file.type.startsWith("image/")) {
      console.error(`선택된 파일 "${file.name}"이 이미지 파일이 아닙니다.`);
      return null; // 이미지 파일이 아닌 경우 처리하지 않음
    }
    const result = await readMediaFileAsync(file, currentIndex + index);
    return result;
  }));

  // 유효한 파일들만 추가
  const validFilesInfo = filesInfo.filter(fileInfo => fileInfo !== null);
  setFiles((prevInfos) => [...prevInfos, ...validFilesInfo]);
};

// 동영상 파일 선택 시 실행
export const handleVideoFileChange = async (files, setFiles) => {
  const currentIndex = getCurrentIndex(files);

  // 파일이 배열인지 확인하고, 배열이 아니면 배열로 변환
  const videoFiles = Array.isArray(files) ? files : [files];

  const filesInfo = await Promise.all(videoFiles.map(async (file, index) => {
    if (!file.type.startsWith("video/")) {
      console.error(`선택된 파일 "${file.name}"이 동영상 파일이 아닙니다.`);
      return null;
    }
    const result = await readMediaFileAsync(file, currentIndex + index);
    return result;
  }));

  // 유효한 파일들만 추가
  const validFilesInfo = filesInfo.filter(fileInfo => fileInfo !== null);
  setFiles((prevInfos) => [...prevInfos, ...validFilesInfo]);
};

// 문서 파일 선택 시 실행
export const handleDocumentChange = async (files, setFiles) => {
  const selectedFiles = files;

  const DocuFiles = selectedFiles.filter(file => !file.type.startsWith("video/") && !file.type.startsWith("image/"));

  // 현재 문서 파일에 대한 index 값을 상태에서 가져옴
  const documentFiles = files.filter(file => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
  const currentIndex = documentFiles.length;

  // 각 파일에 대한 정보를 담는 배열
  const filesInfo = await Promise.all(DocuFiles.map(async (file, index) => {
    const result = await readFileAsync(file, currentIndex + index); // 수정된 index 값을 전달
    return result;
  }));

  // 파일 정보를 상태에 업데이트
  setFiles((prevInfos) => [...prevInfos, ...filesInfo]);
};


// 문서파일 선택시 문서파일 정보저장
export const readFileAsync = (file, index) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = function (event) {
      const fileInfo = {
        file,
        index,
        url: URL.createObjectURL(file),
        width: 0,
        height: 0,
        size: file?.size,
        type: file?.type,
      };

      resolve(fileInfo);
    };
    fileReader.onerror = function (error) {
      reject(error);
    };

    // Cache Busting: 파일 이름에 timestamp 추가
    fileReader.readAsDataURL(file, Date.now());
  });
};

// 이미지 or 동영상 선택시 가로세로 구하고 정보 저장
export const readMediaFileAsync = async (file, index) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = function (event) {

      if (isImageFile(file)) {
        const img = new Image();

        img.onload = function () {
          const fileInfo = {
            file,
            index,
            width: img.width,
            height: img.height,
            size: file?.size,
            type: file?.type,
          };

          resolve(fileInfo);
        };

        img.onerror = function (error) {
          reject(error);
        };

        img.src = event.target.result;
      } else {
        // 동영상인 경우 비디오 엘리먼트 생성하여 크기 추출
        const video = document.createElement("video");

        video.onloadedmetadata = function () {
          const fileInfo = {
            file,
            index,
            url: URL.createObjectURL(file),
            width: video.videoWidth,
            height: video.videoHeight,
            size: file?.size,
            type: file?.type,
          };

          resolve(fileInfo);
        };

        video.onerror = function (error) {
          reject(error);
        };

        video.src = URL.createObjectURL(file);
      }
    };

    fileReader.onerror = function (error) {
      reject(error);
    };

    // Cache Busting: 파일 이름에 timestamp 추가
    fileReader.readAsDataURL(file, Date.now());
  });
};

// 파일 업로드 함수
export const sendFileData = async (fileInfos, userInfo, token, setUploadProgress) => {
  // 토큰 포맷 처리
  const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  // 파일이 없을 경우에도 최소값을 1로 설정하여 게이지바를 채우도록 조치
  const totalFiles = Math.max(fileInfos.length, 1);

  // 각 파일에 대한 업로드를 비동기적으로 진행
  await Promise.all(fileInfos.map(async (fileInfo) => {
    const formData = new FormData();

    // 선택된 이미지 파일들을 formData에 추가
    formData.append("file", fileInfo.file);
    formData.append(`index`, fileInfo.index);
    formData.append(`width`, fileInfo.width);
    formData.append(`height`, fileInfo.height);
    formData.append(`ownerId`, userInfo.userId);

    try {
      // 이미지 파일 업로드 진행
      const response = await axiosReal.post(`${import.meta.env.VITE_API_URL}/v2/file`, formData, {
        headers: {
          Authorization: formattedToken,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress((prevProgress) => Math.max(prevProgress, progress / totalFiles));
        },
      });

      fileInfo.id = response.data.data.id;
      return response;
    } catch (error) {
      console.error("이미지 파일 업로드 에러:", error);
      throw error;
    }
  }));
};

// 이미지 파일 여부를 확인하는 함수
export const isImageFile = (file) => {
  return file.type.startsWith("image/");
};

// 이미지 파일과 동영상 파일에 대한 index 값을 상태에서 가져오는 함수
export const getCurrentIndex = (files) => {
  const currentIndex = files.filter(f => f.type.startsWith("image/")).length +
    files.filter(f => f.type.startsWith("video/")).length;
  return currentIndex;
};