import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Eye, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePostApi } from "@/service/api/postApi"
import { applyTimezoneWithPattern } from "@/utils/formatDate.js"
import TipTabViewer from "@/components/modal/detail-modal/tiptab-viewer.jsx";

export default function HomeNoticeDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { data: notice, isLoading } = usePostApi().usePostDetail(params.id)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  if (!notice?.data) {
    navigate("/notice")
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 transition-colors duration-200">
      <main className="container px-4 py-8 mx-auto max-w-[900px]">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/notice")}
            className="mb-4 text-gray-600 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            목록으로 돌아가기
          </Button>

          <Card className="border dark:border-navy-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gray-200 text-gray-700 dark:bg-navy-700 dark:text-gray-300">
                  {"공지사항"}
                </Badge>
              </div>

              <h1 className="text-2xl font-bold mb-4 dark:text-white">{notice.data.title}</h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{applyTimezoneWithPattern(notice.data.created_at, 2)}</span>
                </div>
              </div>

              <Separator className="mb-6 dark:bg-navy-700" />

              <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 mb-8">
                {/*{notice.data.content}*/}
                <div className="mt-1 text-[#262626]">
                  <TipTabViewer post={notice.data} />
                </div>
              </div>

              {notice.data.files && notice.data.files.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-3 dark:text-white">첨부파일</h3>
                  <div className="space-y-2">
                    {notice.data.files.map((file, index) => (
                        <div key={index} className="mt-2 bg-[#fafafa] rounded-md px-2 py-1 border border-[#efefef]">
                              <a
                                  key={file.id}
                                  href={file.address}
                                  download={file.name}
                                  className="flex items-center gap-2 text-sm text-black py-1.5 hover:underline"
                              >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style={{width: "20px", height: "20px"}}
                                >
                                  <path
                                      fillRule="evenodd"
                                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0
v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                      clipRule="evenodd"
                                  />
                                </svg>
                                <span className="truncate text-black">{file.name}</span>
                              </a>
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/notice")}
            className="text-gray-600 dark:text-gray-300 dark:border-navy-600"
          >
            목록
          </Button>
        </div>
      </main>
    </div>
  )
}
