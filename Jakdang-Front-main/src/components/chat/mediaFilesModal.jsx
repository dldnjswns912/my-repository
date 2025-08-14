"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import {
  File,
  FileImage,
  Loader2,
  Download,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaFiles } from "@/hooks/useMediaFiles";
import { useFileApi } from "@/service/api/fileApi";
import { saveAs } from "file-saver";

export function MediaFilesModal({ isOpen, onClose, roomId }) {
  const [activeTab, setActiveTab] = useState("images");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    groupedAttachments,
    sortedDateGroups,
    isLoading,
    isFetchingNextPage,
    hasMore,
    loaderRef,
    refetch,
  } = useMediaFiles(roomId, activeTab);

  const { downloadFile } = useFileApi();

  useEffect(() => {
    if (isOpen && roomId) {
      refetch();
    }
  }, [isOpen, roomId, refetch]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // 스크롤 위치를 유지하고 탭 변경 시 데이터 로딩만 처리
      refetch();
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  };

  const formatDateHeader = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "오늘";
    if (date.getTime() === yesterday.getTime()) return "어제";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ImageSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="flex flex-col">
            <div className="aspect-square rounded-md overflow-hidden bg-gray-200 animate-pulse"></div>
            <div className="mt-1 h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
    </div>
  );

  const FileSkeleton = ({ count = 5 }) => (
    <div className="space-y-2">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-gray-100 rounded-md"
          >
            <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse mr-3"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
    </div>
  );

  const handleDownloadFile = async (dto, filename) => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await downloadFile(dto);

      if (response && response.data) {
        const fileExtension = filename.split(".").pop().toLowerCase();

        let mimeType = "application/octet-stream";
        if (["jpg", "jpeg"].includes(fileExtension)) {
          mimeType = "image/jpeg";
        } else if (fileExtension === "png") {
          mimeType = "image/png";
        } else if (fileExtension === "gif") {
          mimeType = "image/gif";
        } else if (fileExtension === "pdf") {
          mimeType = "application/pdf";
        } else if (["doc", "docx"].includes(fileExtension)) {
          mimeType = "application/msword";
        } else if (["xls", "xlsx"].includes(fileExtension)) {
          mimeType = "application/vnd.ms-excel";
        }

        // ArrayBuffer를 직접 사용
        const blob = new Blob([response.data], { type: mimeType });
        saveAs(blob, filename);
      }
    } catch (error) {
      console.error("파일 다운로드 중 오류 발생:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:w-full w-full h-full p-0 rounded-lg border-0 shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 섹션 - sticky 속성 추가 */}
        <div className="bg-[#5288c1] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <h2 className="text-lg font-bold text-white">미디어 모아보기</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-[#4a7cb0] p-1.5 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 탭 섹션 - sticky 속성 추가 */}
        <div className="flex border-b border-t border-gray-200 h-12 min-h-[48px] sticky top-[49px] z-10 bg-white">
          <button
            onClick={() => handleTabChange("images")}
            className={cn(
              "flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors",
              activeTab === "images"
                ? "text-[#5288c1] border-b-2 border-[#5288c1]"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <span>사진</span>
          </button>
          <button
            onClick={() => handleTabChange("files")}
            className={cn(
              "flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors",
              activeTab === "files"
                ? "text-[#5288c1] border-b-2 border-[#5288c1]"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <span>파일</span>
          </button>
        </div>

        {/* 내용 컨테이너 부분 */}
        <div
          className="flex-1 overflow-y-auto bg-gray-50"
          style={{ minHeight: "300px" }}
        >
          {isLoading ? (
            <div className="p-3 min-h-[300px]">
              {activeTab === "images" ? <ImageSkeleton /> : <FileSkeleton />}
            </div>
          ) : sortedDateGroups.length > 0 ? (
            <div className="p-3">
              {sortedDateGroups.map((dateKey, groupIndex) => (
                <div key={dateKey} className="mb-4">
                  <div className="sticky top-[0px] bg-gray-50 z-5 py-2 px-1 mb-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600">
                      {formatDateHeader(dateKey)}
                    </h3>
                  </div>
                  {activeTab === "images" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedAttachments[dateKey].map((attachment, index) => {
                        const isLastGroup =
                          groupIndex === sortedDateGroups.length - 1;
                        const isLastItem =
                          index === groupedAttachments[dateKey].length - 1;
                        const shouldAttachRef =
                          isLastGroup && isLastItem && hasMore;
                        return (
                          <div
                            key={attachment.id}
                            ref={shouldAttachRef ? loaderRef : null}
                            className="flex flex-col group relative cursor-pointer"
                            onClick={() => handleImageClick(attachment)}
                          >
                            <div className="aspect-square rounded-md overflow-hidden border border-gray-200">
                              <img
                                src={attachment.url || "/placeholder.svg"}
                                alt={attachment.name}
                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-600">
                                {attachment.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dto = {
                                    key: attachment.id,
                                  };
                                  handleDownloadFile(dto, attachment.name);
                                }}
                                className="text-gray-500 hover:text-[#5288c1] p-1"
                                title="다운로드"
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupedAttachments[dateKey].map((attachment, index) => {
                        const isLastGroup =
                          groupIndex === sortedDateGroups.length - 1;
                        const isLastItem =
                          index === groupedAttachments[dateKey].length - 1;
                        const shouldAttachRef =
                          isLastGroup && isLastItem && hasMore;
                        return (
                          <div
                            key={attachment.id}
                            ref={shouldAttachRef ? loaderRef : null}
                            className="flex items-center p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="h-10 w-10 rounded-md bg-[#5288c1] flex items-center justify-center mr-3">
                              <File className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.name}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{formatDate(attachment.date)}</span>
                              </div>
                            </div>
                            <div className="flex">
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const dto = {
                                    key: attachment.id,
                                  };
                                  handleDownloadFile(dto, attachment.name);
                                }}
                                className="p-2 text-gray-500 hover:text-[#5288c1]"
                                title="새 탭에서 열기"
                              >
                                <ExternalLink className="h-5 w-5" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dto = {
                                    key: attachment.id,
                                  };
                                  handleDownloadFile(dto, attachment.name);
                                }}
                                className="p-2 text-gray-500 hover:text-[#5288c1]"
                                title="다운로드"
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Download className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
              {activeTab === "images" ? (
                <>
                  <FileImage className="h-16 w-16 mb-3 text-gray-300" />
                  <p>사진이 없습니다</p>
                </>
              ) : (
                <>
                  <File className="h-16 w-16 mb-3 text-gray-300" />
                  <p>파일이 없습니다</p>
                </>
              )}
            </div>
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[#5288c1]" />
            </div>
          )}
          {hasMore && !isLoading && sortedDateGroups.length > 0 && (
            <div ref={loaderRef} className="h-10" />
          )}
        </div>
        {/* 이미지 상세 보기 모달 */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeImagePreview();
                  }}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center h-full">
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.name}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
              <div className="bg-black bg-opacity-70 text-white p-3 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm truncate">{selectedImage.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dto = {
                        key: selectedImage.id,
                      };
                      handleDownloadFile(dto, selectedImage.name);
                    }}
                    className="text-white hover:text-[#5288c1] p-1 ml-2"
                    title="다운로드"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
