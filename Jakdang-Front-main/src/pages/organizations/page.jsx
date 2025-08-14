"use client";

import { useState, useEffect } from "react";
import { Search, Building2, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import {
  useMyOrganizations,
  useRecommendedOrganizations,
} from "@/hooks/useOrganizations";
import OrganizationRegisterModal from "@/components/modal/organization-register-modal.jsx";
import { isAuthenticatedAtom } from "@/jotai/authAtoms";
import { useAtomValue } from "jotai";
import { Skeleton } from "@/components/ui/skeleton";
// Add this new array for joined organizations

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: myOrganizations, isLoading: myOrgLoading } =
    useMyOrganizations();
  const { data: recommendedOrganizations, isLoading: recommendedOrgLoading } =
    useRecommendedOrganizations();
  const [isOrganizationRegisterModalOpen, setIsOrganizationRegisterModalOpen] =
    useState(false);
  const navigate = useNavigate();
  const isAuth = useAtomValue(isAuthenticatedAtom);
  // Add this state inside the OrganizationsPage component, near the other useState declarations

  // Add this sample notification data inside the OrganizationsPage component, after the state declarations
  // For theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (query) => {
    if (!query.trim()) {
      return;
    }
    navigate(`/organizations/search`, { state: { query } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <main className="container mx-auto px-4 py-8 max-w-[1200px] mb-15">
        {/* 검색 및 필터 */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex flex-row gap-4 items-center w-full">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="기관명을 입력하세요"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch(searchQuery);
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              className="w-full md:w-18 w-16 cursor-pointer"
              onClick={() => handleSearch(searchQuery)}
            >
              검색
            </Button>
          </div>
          {isAuth && (
            <Button
              className="min-w-[150px] bg-navy-600 hover:bg-navy-700 text-white dark:bg-navy-500 dark:hover:bg-navy-600 mt-4 md:mt-0 cursor-pointer"
              onClick={() => setIsOrganizationRegisterModalOpen(true)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              기관 등록 신청
            </Button>
          )}
        </div>

        {/* 내가 가입한 기관 - 로그인한 사용자에게만 표시 */}
        {isAuth && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">
              내가 가입한 기관
            </h2>
            {myOrgLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="h-full overflow-hidden">
                    <div className="h-40 bg-slate-100 dark:bg-navy-800 flex items-center justify-center">
                      <Skeleton className="w-32 h-32 rounded-md" />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-7 w-3/4 mb-2" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myOrganizations?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myOrganizations.map((org) => (
                  <Link to={`/organization/${org.id}`} key={org.id}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                      <div className="h-40 bg-slate-100 dark:bg-navy-800 flex items-center justify-center">
                        <div className="w-32 h-32 bg-white dark:bg-navy-700 rounded-md flex items-center justify-center p-2">
                          {org.logo ? (
                            <img
                              src={org.logo || "/placeholder.svg"}
                              alt={org.name}
                              width={80}
                              height={80}
                              className="max-h-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-16 w-16 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-xl dark:text-white">
                            {org.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                          {org.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{org.location || "주소 없음"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-lg shadow">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium dark:text-white mb-2">
                  가입한 기관이 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  관심있는 기관에 가입해보세요.
                </p>
              </div>
            )}
          </section>
        )}

        {/* 추천 기관 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">추천 기관</h2>
          {recommendedOrgLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="h-full overflow-hidden">
                  <div className="h-40 bg-slate-100 dark:bg-navy-800 flex items-center justify-center">
                    <Skeleton className="w-32 h-32 rounded-md" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-7 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendedOrganizations?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedOrganizations.map((org) => (
                <Link to={`/organization/details/${org.id}`} key={org.id}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                    <div className="h-40 bg-slate-100 dark:bg-navy-800 flex items-center justify-center">
                      <div className="w-32 h-32 bg-white dark:bg-navy-700 rounded-md flex items-center justify-center p-2">
                        {org.logo ? (
                          <img
                            src={org.logo || "/placeholder.svg"}
                            alt={org.name}
                            width={80}
                            height={80}
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-16 w-16 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl dark:text-white">
                          {org.name}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {org.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{org.location || "주소 없음"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-lg shadow">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium dark:text-white mb-2">
                추천 기관이 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                나중에 다시 확인해주세요.
              </p>
            </div>
          )}
        </section>

        {/* 기관 목록 */}
        <section>
          <h2 className="text-2xl font-bold mb-6 dark:text-white">
            {searchQuery || selectedCategory !== "all"
              ? "검색 결과"
              : "모든 기관"}
          </h2>
          {recommendedOrgLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <OrganizationSkeleton key={index} />
              ))}
            </div>
          ) : recommendedOrganizations &&
            recommendedOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedOrganizations.map((org) => (
                <Link to={`/organization/details/${org.id}`} key={org.id}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white dark:bg-navy-700 rounded-md flex items-center justify-center p-2 border dark:border-navy-600">
                          {org.logo !== null && org.logo.trim() !== "" ? (
                            <img
                              src={org.logo || "/placeholder.svg"}
                              alt={org.name}
                              width={50}
                              height={50}
                              className="max-h-full object-contain"
                            />
                          ) : (
                            <Building2 />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">
                            {org.name}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{org.location}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {org.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {/*<Users className="h-4 w-4 mr-1" />*/}
                        {/*<span>{org.members.toLocaleString()}명</span>*/}
                        <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-lg shadow">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium dark:text-white mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                다른 검색어나 필터를 사용해 보세요.
              </p>
            </div>
          )}
        </section>
      </main>
      {/* 기관 등록 신청 모달 */}
      <OrganizationRegisterModal
        isOpen={isOrganizationRegisterModalOpen}
        onClose={() => setIsOrganizationRegisterModalOpen(false)}
      />
    </div>
  );
}

function OrganizationSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-16 h-16 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex items-center justify-end">
          <Skeleton className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
