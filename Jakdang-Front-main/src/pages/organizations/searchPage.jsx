import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, ArrowRight, Clock, XCircle, Loader2, Building, Phone, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useAtomValue } from "jotai";
import { userInfoAtom } from "@/jotai/authAtoms";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

// Recent searches local storage utility
const useRecentSearches = () => {
  const MAX_RECENT_SEARCHES = 5;

  const getRecentSearches = () => {
    try {
      const searches = localStorage.getItem('recentOrganizationSearches');
      return searches ? JSON.parse(searches) : [];
    } catch (error) {
      console.error('Error retrieving recent searches:', error);
      return [];
    }
  };

  const addRecentSearch = (searchTerm) => {
    if (!searchTerm) return;
    
    try {
      let searches = getRecentSearches();
      
      // Remove if already exists to avoid duplicates
      searches = searches.filter(term => term !== searchTerm);
      
      // Add new search term at the beginning
      searches.unshift(searchTerm);
      
      // Keep only the most recent searches
      searches = searches.slice(0, MAX_RECENT_SEARCHES);
      
      localStorage.setItem('recentOrganizationSearches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem('recentOrganizationSearches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  return { getRecentSearches, addRecentSearch, clearRecentSearches };
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { useGet } = useAxiosQuery();
  const location = useLocation();
  const queryClient = useQueryClient();
  const userInfo = useAtomValue(userInfoAtom);
  const { getRecentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const searchQueryString = location.state?.query || "";
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const { data, isLoading } = useGet(
    "searchOrganization", 
    "/organizations/search", 
    { name: debouncedSearchQuery || searchQueryString },
    { enabled: Boolean(debouncedSearchQuery || searchQueryString) }
  );
  
  // Search results
  const organizationResults = data?.data?.content || [];
  const totalResults = data?.data?.totalElements || 0;

  useEffect(() => {
    if (searchQueryString) {
      setSearchQuery(searchQueryString);
    }
    loadRecentSearches();
  }, [searchQueryString]);

  const loadRecentSearches = () => {
    const searches = getRecentSearches();
    setRecentSearches(searches);
  };

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }
    
    addRecentSearch(searchQuery);
    loadRecentSearches();
    
    queryClient.invalidateQueries(["searchOrganization"]);
  }, [searchQuery, queryClient, addRecentSearch]);

  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      queryClient.invalidateQueries(["searchOrganization"]);
    }
  }, [debouncedSearchQuery, queryClient]);

  const navigateToDetail = (organizationId) => {
    navigate(`/organization/details/${organizationId}`);
  };
  
  const handleRecentSearchClick = (term) => {
    setSearchQuery(term);
    addRecentSearch(term);
    queryClient.invalidateQueries(["searchOrganization"]);
  };

  const removeSearchTerm = (term, e) => {
    e.stopPropagation(); 
    const updatedSearches = recentSearches.filter(item => item !== term);
    localStorage.setItem('recentOrganizationSearches', JSON.stringify(updatedSearches));
    setRecentSearches(updatedSearches);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto py-8 px-4 lg:px-8 max-w-screen-lg">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-2">
            기관 검색
          </h1>
          <p className="text-slate-600 mb-6">
            원하는 기관을 검색하고 정보를 확인할 수 있습니다.
          </p>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="기관명을 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full h-12 pl-4 pr-4 text-base border-slate-300 rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="h-12 px-6 bg-navy-600 text-white hover:bg-navy-700 dark:bg-navy-500 dark:hover:bg-navy-600 text-white transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                검색
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-screen-lg">
        {organizationResults.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-800">
                검색 결과 <span className="text-slate-500">({totalResults})</span>
              </h2>
            </div>
            <Separator className="bg-slate-200" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">검색 중입니다...</p>
            </div>
          </div>
        ) : organizationResults.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {organizationResults.map((organization) => (
              <Card key={organization.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {organization.logo ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden">
                          <img 
                            src={organization.logo} 
                            alt={`${organization.name} 로고`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                          <Building className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <CardTitle className="text-lg font-medium text-slate-800">
                        {organization.name}
                      </CardTitle>
                    </div>
                    <Badge 
                      className={`${
                        organization.membershipStatus === "JOINED" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-slate-100 text-slate-700"
                      } hover:bg-slate-200 font-normal`}
                    >
                      {organization.membershipStatus === "JOINED" ? "가입됨" : "미가입"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-slate-600 text-sm mb-3">
                    {organization.description || "설명이 없습니다."}
                  </p>
                  
                  {organization.phone && (
                    <div className="flex items-center text-xs text-slate-500 mb-1">
                      <Phone className="h-3 w-3 mr-2" />
                      {organization.phone}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-2 flex justify-between items-center">
                  <div className="flex items-center">
                    {organization.activated ? (
                      <Badge variant="outline" className="text-xs text-green-600 bg-green-50 border-green-200">
                        활성화됨
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-slate-500 bg-slate-50 border-slate-200">
                        비활성화
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => navigateToDetail(organization.id)}
                  >
                    자세히 보기
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-16 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-center max-w-md px-4">
              {searchQuery ? (
                <>
                  <XCircle className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-slate-600 mb-4">
                    검색 결과를 찾을 수 없습니다. 다른 검색어를 시도해보세요.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      queryClient.invalidateQueries(["searchOrganization"]);
                    }}
                    className="text-sm cursor-pointer"
                  >
                    검색어 지우기
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    검색을 시작하세요
                  </h3>
                  <p className="text-slate-600">
                    검색창에 기관명을 입력하고 검색 버튼을 클릭하면 결과가 이곳에 표시됩니다.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {!isLoading && recentSearches.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-slate-700">최근 검색 기록</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                onClick={() => {
                  clearRecentSearches();
                  setRecentSearches([]);
                }}
              >
                모두 지우기
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <div key={index} className="relative">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-transparent border-slate-300 text-slate-600 hover:bg-slate-50 pr-8"
                    onClick={() => handleRecentSearchClick(term)}
                  >
                    {term}
                    <span 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer rounded-full p-0.5 hover:bg-slate-200"
                      onClick={(e) => removeSearchTerm(term, e)}
                    >
                      <X className="h-3 w-3 text-slate-400" />
                    </span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;