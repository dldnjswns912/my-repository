import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePostApi } from "@/service/api/postApi"
import {applyTimezoneWithPattern} from "@/utils/formatDate.js";

export default function NoticePage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")

  const { 
    items,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    onPageChange
  } = usePostApi().usePostPagination({
    postType: "NOTICE",
    published: true,
    sort_by: "createdAt",
    sort_direction: "DESC",
    size: 10,
    search: searchTerm || undefined
  })

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    onPageChange(0)
  }, [searchTerm, onPageChange])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((pageNumber) => {
    onPageChange(pageNumber - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [onPageChange])

  // 페이지네이션 범위 계산
  const getPageRange = useCallback(() => {
    if (!totalPages) return []
    
    const currentWindow = Math.floor(currentPage / 5)
    const start = currentWindow * 5 + 1
    const end = Math.min(start + 4, totalPages)

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentPage, totalPages])

  const getNoticeNumber = useCallback((index) => {
    if (!totalElements) return index + 1;
    return totalElements - (currentPage * 10 + index);
  }, [totalElements, currentPage])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 transition-colors duration-200">
      <main className="container px-4 py-8 mx-auto max-w-[1000px] mb-[60px] sm:mb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">공지사항</h1>
          <div className="w-full sm:w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="제목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 h-9 bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-700 rounded-md text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden sm:block bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-navy-700 text-left">
                  <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-20 text-center">
                    번호
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    제목
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-34 text-center">
                    작성일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-navy-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      로딩 중...
                    </td>
                  </tr>
                ) : items?.length > 0 ? (
                  items.map((notice, index) => (
                    <tr
                      key={notice.id}
                      className="hover:bg-gray-50 dark:hover:bg-navy-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/notice/${notice.id}`)}
                    >
                      <td className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                        {getNoticeNumber(index)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-100 font-medium line-clamp-1">
                          {notice.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {applyTimezoneWithPattern(notice.created_at, 2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모바일 카드 뷰 */}
        <div className="sm:hidden space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 text-center text-gray-500 dark:text-gray-400">
              로딩 중...
            </div>
          ) : items?.length > 0 ? (
            items.map((notice, index) => (
              <div
                key={notice.id}
                className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-navy-600 transition-colors"
                onClick={() => navigate(`/notice/${notice.id}`)}
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium">{getNoticeNumber(index)}.</span>
                  <span className="flex items-center gap-1">
                    {applyTimezoneWithPattern(notice.created_at, 1)}
                  </span>
                </div>
                <h2 className="text-gray-900 dark:text-gray-100 font-medium line-clamp-2">
                  {notice.title}
                </h2>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {items?.length > 0 && totalPages > 0 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              {/* 첫 페이지 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 0}
                className="w-8 h-8 p-0 hidden sm:flex items-center justify-center"
              >
                <div className="flex items-center">
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </div>
                <span className="sr-only">첫 페이지</span>
              </Button>

              {/* 이전 페이지 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">이전 페이지</span>
              </Button>

              {/* 페이지 번호 버튼들 */}
              {getPageRange().map((page) => (
                <Button
                  key={page}
                  variant={currentPage + 1 === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(page - 1)}
                  className={`w-8 h-8 p-0 flex items-center justify-center ${
                    currentPage + 1 === page
                      ? "bg-navy-600 hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600"
                      : ""
                  }`}
                >
                  {page}
                  <span className="sr-only">페이지 {page}</span>
                </Button>
              ))}

              {/* 다음 페이지 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= (totalPages - 1)}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">다음 페이지</span>
              </Button>

              {/* 마지막 페이지 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(totalPages - 1)}
                disabled={currentPage >= (totalPages - 1)}
                className="w-8 h-8 p-0 hidden sm:flex items-center justify-center"
              >
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </div>
                <span className="sr-only">마지막 페이지</span>
              </Button>
            </nav>
          </div>
        )}
      </main>
    </div>
  )
}
