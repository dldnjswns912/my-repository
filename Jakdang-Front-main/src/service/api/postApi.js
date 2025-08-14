import { useAxios } from "@/hooks/useAxios";
import { useAxiosQuery } from "@/hooks/useAxiosQuery";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export const usePostApi = () => {
  const { useGet, usePost, usePut, useDelete } = useAxiosQuery();
  const queryClient = useQueryClient();

  const usePostDetail = (postId, options = {}) => {
    return useGet(
      ["posts", "detail", postId],
      `/posts/detail/${postId}`,
        {},
      options
    );
  };

  const usePostInfiniteScroll = (params, options = {}) => {
    const { getAxiosWithToken } = useAxios();

    const fetchPosts = useCallback(
      async ({ pageParam = 0 }) => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.get("/posts", {
            params: { ...params, page: pageParam },
          });

          return response.data?.data?.content || [];
        } catch (error) {
          console.error("게시물 데이터 가져오기 실패:", error);
          throw error;
        }
      },
      [params, getAxiosWithToken]
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
      queryKey: ["posts", params],
      queryFn: fetchPosts,
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
      hasNextPage,
      error,
      status,
      loaderRef,
      refetch,
      fetchNextPage,
    };
  };

  const usePostPagination = (params, options = {}) => {
    const { getAxiosWithToken } = useAxios();
    const [page, setPage] = useState(0);

    const fetchPosts = useCallback(
      async () => {
        try {
          const axiosInstance = getAxiosWithToken();
          const response = await axiosInstance.get("/posts", {
            params: { ...params, page },
          });

          return response.data?.data || {};
        } catch (error) {
          console.error("게시물 데이터 가져오기 실패:", error);
          throw error;
        }
      },
      [params, page, getAxiosWithToken]
    );

    const { data, status, error, refetch, isLoading, isFetching } = useQuery({
      queryKey: ["posts", params, page],
      queryFn: fetchPosts,
      keepPreviousData: true,
      staleTime: 5000,
      ...options,
    });

    const handlePageChange = useCallback((newPage) => {
      setPage(newPage);
    }, []);

    return {
      items: data?.content || [],
      totalPages: data?.totalPages || 0,
      totalElements: data?.totalElements || 0,
      currentPage: page,
      isLoading,
      isFetching,
      error,
      status,
      refetch,
      onPageChange: handlePageChange,
    };
  };

  const createPostMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
    },
  });

  const LikePostMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      queryClient.invalidateQueries(["popularPosts"]);
    },
  });

  const BookmarkPostMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      queryClient.invalidateQueries(["popularPosts"]);
    },
  });

  const updatePostMutation = usePut({
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
    },
  });

  const deletePostMutation = useDelete({
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
    },
  });

  const useComments = (postId, options = {}) => {
    return useGet(
      ["posts", "comments", postId],
      `/posts/comments/${postId}`,
      {},
      options
    );
  };

  const createCommentMutation = usePost({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([
        "posts",
        "comments",
        variables.data.postId,
      ]);
      queryClient.invalidateQueries(["posts", "detail", variables.data.postId]);
    },
  });

  const updateCommentMutation = usePut({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([
        "posts",
        "comments",
        variables.data.postId,
      ]);
    },
  });

  const deleteCommentMutation = useDelete({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["posts", "comments", variables.params.postId]);
      queryClient.invalidateQueries(["posts", "detail", variables.params.postId]);
    },
  });

  return {
    usePostDetail,
    usePostInfiniteScroll,
    usePostPagination,

    // 게시글 CRUD
    createPost: (postData) =>
      createPostMutation.mutateAsync({
        endPoint: "/posts",
        data: postData,
      }),
    updatePost: (postData) =>
      updatePostMutation.mutateAsync({
        endPoint: `/posts/${postData.id}`,
        data: postData,
      }),
    deletePost: (postId, authorId) =>
      deletePostMutation.mutateAsync({
        endPoint: `/posts/${postId}`,
        params: { authorId },
      }),
    likePost: (postId, userId) =>
      LikePostMutation.mutateAsync({
        endPoint: `/posts/likes`,
        params: { postId, userId },
      }),
    bookmarkPost: (postId, userId) =>
      BookmarkPostMutation.mutateAsync({
        endPoint: `/posts/bookmarks/toggle`,
        params: { postId, userId },
      }),

    isCreatingPost: createPostMutation.isLoading,
    isUpdatingPost: updatePostMutation.isLoading,
    isDeletingPost: deletePostMutation.isLoading,
    isLikingPost: LikePostMutation.isLoading,
    isBookmarkingPost: BookmarkPostMutation.isLoading,

    // 댓글 CRUD
    useComments,
    createComment: (commentData) =>
      createCommentMutation.mutateAsync({
        endPoint: "/posts/comments",
        data: commentData,
      }),
    updateComment: (commentData) =>
      updateCommentMutation.mutateAsync({
        endPoint: "/posts/comments",
        data: commentData,
      }),
    deleteComment: (postId, commentId, authorId) =>
      deleteCommentMutation.mutateAsync({
        endPoint: `/posts/comments/${postId}/${commentId}`,
        params: { authorId },
      }),
    isCreatingComment: createCommentMutation.isLoading,
    isUpdatingComment: updateCommentMutation.isLoading,
    isDeletingComment: deleteCommentMutation.isLoading,
  };
};