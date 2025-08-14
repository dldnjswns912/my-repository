import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAxiosQuery } from "@/hooks/useAxiosQuery.js";
import { useAxios } from "@/hooks/useAxios";
import { useCallback, useMemo } from "react";

export const useAssignmentApi = () => {
  const { useGet, usePost, usePut, useDelete } = useAxiosQuery();
  const queryClient = useQueryClient();

  // 과제 목록 무한 스크롤
  const useAssignmentInfiniteScroll = ({ classId, search }, options = {}) => {
    const { getAxiosWithToken } = useAxios();

    const fetchAssignments = useCallback(
      async ({ pageParam = 0 }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.get(`/assignments/${classId}`, {
            params: { 
              page: pageParam,
              search: search
            },
          });
          return response.data?.data || [];
        } catch (error) {
          console.error("과제 목록 조회 실패:", error);
          throw error;
        }
      },
      [classId, search, getAxiosWithToken]
    );

    const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      status,
      error,
      refetch,
      isLoading,
      isFetching,
    } = useInfiniteQuery({
      queryKey: ["assignments", classId, search],
      queryFn: fetchAssignments,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.length === 0) {
          return undefined;
        }
        return allPages.length;
      },
      ...options,
    });

    const items = useMemo(() => {
      return data?.pages.flatMap((page) => page) || [];
    }, [data]);

    const loaderRef = useCallback(
      (node) => {
        if (!node || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasNextPage) {
              fetchNextPage();
            }
          },
          { threshold: 0.1 }
        );

        observer.observe(node);

        return () => {
          observer.disconnect();
        };
      },
      [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    return {
      items,
      isLoading,
      isFetching: isFetching && !isFetchingNextPage,
      isFetchingNextPage,
      hasMore: hasNextPage,
      error,
      status,
      loaderRef,
      refetch,
      fetchNextPage,
    };
  };

  // 과제 제출 mutation
  const submitAssignmentMutation = usePost({
    onSuccess: () => {
      toast.success("과제가 성공적으로 제출되었습니다.");
      queryClient.invalidateQueries(["assignments"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "과제 제출 중 오류가 발생했습니다.");
    }
  });

  // 과제 출제 mutation
  const createAssignmentMutation = usePost({
    onSuccess: () => {
      toast.success("과제가 성공적으로 등록되었습니다.");
      queryClient.invalidateQueries(["assignments"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "과제 등록 중 오류가 발생했습니다.");
    }
  });

  // 과제 상세 조회
  const useAssignmentDetail = (assignmentId, options = {}) => {
    return useGet(
      ["assignments", "detail", assignmentId],
      `/assignments/detail/${assignmentId}`,
      {},
      options
    );
  };

  return {
    // 과제 목록 조회
    useAssignmentInfiniteScroll,
    useAssignmentDetail,

    // 과제 제출
    submitAssignment: ({ postId, fileIds, description }) => {
      return submitAssignmentMutation.mutateAsync({
        endPoint: `/assignments/${postId}/submit`,
        data: { fileIds, description }
      });
    },
    isSubmitting: submitAssignmentMutation.isLoading,

    // 과제 출제
    createAssignment: (assignmentData) =>
      createAssignmentMutation.mutateAsync({
        endPoint: "/posts",
        data: {
          ...assignmentData,
          postType: "ASSIGNMENT",
          published: true
        }
      }),
    isCreating: createAssignmentMutation.isLoading,
  };
};