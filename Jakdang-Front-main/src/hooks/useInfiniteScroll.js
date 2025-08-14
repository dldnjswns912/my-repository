// useInfiniteScroll.js - 역방향 스크롤 지원 추가
import { useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

const useInfiniteScroll = (queryKey, fetchFn, options = {}) => {
  const { 
    threshold = 0.1,
    reversed = false, // 역방향 스크롤 여부
    queryOptions = {}
  } = options;

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  // 기본 queryOptions 설정
  const defaultQueryOptions = {
    staleTime: 120000, // 2분간 캐시 데이터 유지
    cacheTime: 300000, // 5분간 캐시 보관
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 방지
    refetchOnReconnect: false,  // 재연결 시 자동 refetch 방지
    retry: 1,  // 실패 시 재시도 횟수 제한
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch,
    isLoading,
    isFetching
  } = useInfiniteQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: ({ pageParam = 1 }) => fetchFn(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) {
        return undefined;
      }
      return allPages.length + 1;
    },
    ...defaultQueryOptions,
    ...queryOptions
  });

  const items = data ? data.pages.flat() : [];

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const setLoaderRef = useCallback(
    (node) => {
      if (loaderRef.current) {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      }

      loaderRef.current = node;

      if (node) {
        const observer = new IntersectionObserver(handleObserver, {
          threshold: threshold,
          // 역방향 스크롤인 경우 rootMargin 상단에 여유 공간 추가
          rootMargin: reversed ? '400px 0px 0px 0px' : '0px 0px 400px 0px'
        });
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [handleObserver, threshold, reversed]
  );

  // 컴포넌트 언마운트 시 Observer 정리
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    isFetching: isFetching && !isFetchingNextPage,
    isFetchingNextPage,
    hasMore: hasNextPage,
    error,
    status,
    loaderRef: setLoaderRef,
    refetch,
    fetchNextPage
  };
};

export default useInfiniteScroll;