// PostsExample.jsx
import React from 'react';
import useInfiniteScroll from './useInfiniteScroll';
import InfiniteScrollComponent from './InfiniteScrollComponent';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ThumbsUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Article = () => {
  const fetchPosts = async (page) => {
    // 실제 API 호출
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`
      );
      
      if (!response.ok) {
        throw new Error('서버 에러가 발생했습니다.');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('데이터를 불러오는데 실패했습니다.');
    }
  };

  // 무한 스크롤 훅 사용
  const {
    items: posts,
    loading,
    hasMore,
    error,
    loaderRef,
    resetItems
  } = useInfiniteScroll(fetchPosts, { initialPage: 1 });

  // 각 포스트를 렌더링하는 함수
  const renderPost = (post, index) => (
    <Card key={`${post.id}-${index}`} className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg capitalize">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{post.body}</p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
        <Badge variant="outline">포스트 ID: {post.id}</Badge>
        <Badge variant="secondary">사용자 ID: {post.userId}</Badge>
      </CardFooter>
    </Card>
  );

  // 커스텀 로딩 컴포넌트
  const loadingComponent = (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
      <span className="text-muted-foreground font-medium">포스트를 불러오는 중...</span>
    </div>
  );

  // 커스텀 에러 컴포넌트
  const errorComponent = (
    <Alert variant="destructive" className="my-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>오류 발생</AlertTitle>
      <AlertDescription className="flex flex-col">
        <span>😕 {error && error.message || '오류가 발생했습니다.'}</span>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 self-end" 
          onClick={resetItems}
        >
          다시 시도
        </Button>
      </AlertDescription>
    </Alert>
  );

  // 커스텀 종료 메시지 컴포넌트
  const endMessageComponent = (
    <Alert className="bg-green-50 border-green-200 my-6">
      <ThumbsUp className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-600">완료</AlertTitle>
      <AlertDescription className="text-green-600">
        모든 포스트를 불러왔습니다! 🎉
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">포스트 목록</h1>
      <p className="text-gray-500 mb-8">JSONPlaceholder API에서 가져온 포스트입니다.</p>
      
      <InfiniteScrollComponent
        items={posts}
        renderItem={renderPost}
        loading={loading}
        hasMore={hasMore}
        error={error}
        loaderRef={loaderRef}
        loadingComponent={loadingComponent}
        errorComponent={errorComponent}
        endMessageComponent={endMessageComponent}
        className="space-y-6"
        onRetry={resetItems}
      />
    </div>
  );
};

export default Article;