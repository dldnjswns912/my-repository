import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * React Query 기반 무한 스크롤 컴포넌트
 */
const InfiniteScrollComponent = ({
  items,
  renderItem,
  isLoading,
  isFetching,
  isFetchingNextPage,
  hasMore,
  error,
  loaderRef,
  loadingComponent,
  fetchingNextPageComponent,
  errorComponent,
  endMessageComponent,
  className,
  noItemsComponent,
  onRetry
}) => {
  // 기본 로딩 컴포넌트
  const defaultLoadingComponent = (
    <div className="flex justify-center items-center py-6">
      <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
      <span className="text-muted-foreground">로딩 중...</span>
    </div>
  );

  // 기본 다음 페이지 가져오기 컴포넌트
  const defaultFetchingNextPageComponent = (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
      <span className="text-muted-foreground text-sm">더 불러오는 중...</span>
    </div>
  );

  // 기본 에러 컴포넌트
  const defaultErrorComponent = (
    <Alert variant="destructive" className="my-4">
      <AlertTitle>오류</AlertTitle>
      <AlertDescription className="flex flex-col">
        <span>{error?.message || '데이터를 불러오는 중 오류가 발생했습니다.'}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 self-end" 
            onClick={onRetry}
          >
            다시 시도
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );

  // 기본 종료 메시지 컴포넌트
  const defaultEndMessageComponent = (
    <Alert className="my-4 bg-muted">
      <AlertTitle>알림</AlertTitle>
      <AlertDescription>
        더 이상 표시할 항목이 없습니다.
      </AlertDescription>
    </Alert>
  );

  // 기본 아이템 없음 컴포넌트
  const defaultNoItemsComponent = (
    <Card className="p-6 text-center text-muted-foreground">
      표시할 항목이 없습니다.
    </Card>
  );

  return (
    <div className={`w-full ${className}`}>
      <div className="space-y-4">
        {/* 초기 로딩 */}
        {isLoading ? (
          loadingComponent || defaultLoadingComponent
        ) : (
          <>
            {/* 아이템 렌더링 */}
            {items.length > 0 ? (
              items.map((item, index) => renderItem(item, index))
            ) : (
              !isFetching && !error && (noItemsComponent || defaultNoItemsComponent)
            )}
            
            {/* 에러 표시 */}
            {error && (errorComponent || defaultErrorComponent)}
            
            {/* 다음 페이지 로딩 표시 */}
            {isFetchingNextPage && (fetchingNextPageComponent || defaultFetchingNextPageComponent)}
            
            {/* 더 이상 아이템이 없을 때 메시지 */}
            {!hasMore && items.length > 0 && (endMessageComponent || defaultEndMessageComponent)}
            
            {/* Intersection Observer의 관찰 대상이 되는 요소 */}
            {hasMore && <div ref={loaderRef} className="h-4 my-2"></div>}
          </>
        )}
      </div>
    </div>
  );
};

InfiniteScrollComponent.propTypes = {
  // 표시할 항목 배열
  items: PropTypes.array.isRequired,
  // 각 항목을 렌더링하는 함수
  renderItem: PropTypes.func.isRequired,
  // 초기 로딩 중 여부
  isLoading: PropTypes.bool.isRequired,
  // 데이터 가져오는 중인지 여부
  isFetching: PropTypes.bool,
  // 다음 페이지 가져오는 중인지 여부
  isFetchingNextPage: PropTypes.bool,
  // 더 로드할 항목이 있는지 여부
  hasMore: PropTypes.bool.isRequired,
  // 오류
  error: PropTypes.any,
  // 로더 요소에 대한 참조 설정 함수
  loaderRef: PropTypes.func.isRequired,
  // 로딩 중일 때 표시할 컴포넌트
  loadingComponent: PropTypes.node,
  // 다음 페이지 가져올 때 표시할 컴포넌트
  fetchingNextPageComponent: PropTypes.node,
  // 오류 발생 시 표시할 컴포넌트
  errorComponent: PropTypes.node,
  // 더 이상 항목이 없을 때 표시할 컴포넌트
  endMessageComponent: PropTypes.node,
  // 추가 클래스 이름
  className: PropTypes.string,
  // 항목이 없을 때 표시할 컴포넌트
  noItemsComponent: PropTypes.node,
  // 재시도 콜백
  onRetry: PropTypes.func
};

InfiniteScrollComponent.defaultProps = {
  className: '',
  isFetching: false,
  isFetchingNextPage: false
};

export default InfiniteScrollComponent;