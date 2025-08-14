import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MapPin, Users, Calendar, ArrowLeft, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import OrganizationJoinRequestModal from "@/components/modal/organization-join-request-modal"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useOrganizationDetail } from "@/hooks/useOrganizations"

export default function OrganizationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: organization, isLoading, refetch } = useOrganizationDetail(id || '')
  const [activeTab, setActiveTab] = useState("about")
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 dark:text-white">기관을 찾을 수 없습니다</h2>
          <p className="text-gray-600 dark:text-gray-400">요청하신 기관 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const handleCancelJoinRequest = () => {
    toast({
      title: "가입 신청 취소",
      description: `${organization.name}에 대한 가입 신청이 취소되었습니다.`,
      variant: "success",
    })

    setOrganization({
      ...organization,
      isPending: false,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-navy-800 border-b dark:border-navy-700 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-[1440px]">
          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 dark:text-white" />
            </Button>
            <h1 className="text-lg font-bold dark:text-white">기관 정보</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-[800px]">
        <Card className="mb-6 overflow-hidden">
          <div className="h-40 bg-slate-100 dark:bg-navy-800 flex items-center justify-center">
            <div className="w-32 h-32 bg-white dark:bg-navy-700 rounded-md flex items-center justify-center p-2">
              {organization.logo ? (
                <img
                  src={`${organization.logo}`}
                  alt={organization.name}
                  width={80}
                  height={80}
                  className="max-h-full object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 dark:bg-navy-600 rounded-md flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                    {organization.name[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold dark:text-white mb-2">{organization.name}</h1>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{organization.location || "주소 없음"}</span>
                </div>
                <div>
                  {organization.categories && (
                    <div className="flex flex-wrap gap-2">
                      {organization.categories.map((category, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="rounded-full dark:border-navy-600 dark:text-gray-300"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {organization.membershipStatus === "JOINED" && (
                <Button className="bg-green-600 hover:bg-green-700 text-white" disabled>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  가입됨
                </Button>
              )}
              {organization.membershipStatus === "PENDING" && (
                <Button className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer" disabled>
                  신청 완료
                </Button>
              )}
              {(organization.membershipStatus === "NOT_JOINED" || organization.membershipStatus === "REJECTED") && (
                <Button className="bg-navy-600 hover:bg-navy-700 text-white cursor-pointer" onClick={() => setIsJoinModalOpen(true)}>
                  가입 신청
                </Button>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-300">{organization.description}</p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-gray-100 dark:bg-navy-700 rounded-lg mb-6">
            <TabsTrigger value="about" className="rounded-lg cursor-pointer">
              소개
            </TabsTrigger>
            <TabsTrigger value="programs" className="rounded-lg cursor-pointer">
              프로그램
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg cursor-pointer">
              연락처
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">기관 소개</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{organization.longDescription || organization.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    {organization.foundedYear && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">설립년도:</span>
                        <span className="font-medium dark:text-white">{organization.foundedYear}년</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">구성원:</span>
                      <span className="font-medium dark:text-white">{organization.memberCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">교육 프로그램</h2>
                {organization.programs && organization.programs.length > 0 ? (
                  <ul className="space-y-2">
                    {organization.programs.map((program) => (
                      <li key={program.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-navy-700 rounded-lg">
                        <span class="w-2 h-2 bg-navy-600 dark:bg-navy-400 rounded-full"></span>
                        
                        <div>
                          <h3 className="font-medium dark:text-white">{program.programName}</h3>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">등록된 프로그램이 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">연락처 정보</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium dark:text-white mb-1">주소</h3>
                    <p className="text-gray-600 dark:text-gray-300">{organization.location || "주소 정보가 없습니다."}</p>
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white mb-1">전화번호</h3>
                    <p className="text-gray-600 dark:text-gray-300">{organization.phone || "전화번호 정보가 없습니다."}</p>
                  </div>
                  {organization.email && (
                    <div>
                      <h3 className="font-medium dark:text-white mb-1">이메일</h3>
                      <p className="text-gray-600 dark:text-gray-300">{organization.email}</p>
                    </div>
                  )}
                  {organization.website && (
                    <div>
                      <h3 className="font-medium dark:text-white mb-1">웹사이트</h3>
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy-600 dark:text-navy-400 flex items-center gap-1 hover:underline"
                      >
                        {organization.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <OrganizationJoinRequestModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          organization={organization}
          onSuccess={() => {
            refetch()
          }}
        />

        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>가입 신청 취소</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center">
                {organization.name}에 대한 가입 신청을 취소하시겠습니까?
              </p>
            </div>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                아니오
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  setIsCancelModalOpen(false)
                  handleCancelJoinRequest()
                }}
              >
                예, 취소합니다
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}