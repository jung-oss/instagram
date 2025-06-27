// src/hooks/useInfiniteScroll.js - 무한 스크롤 커스텀 훅
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (hasMore, loading, loadMore) => {
  const [isFetching, setIsFetching] = useState(false);

  // 스크롤 이벤트 처리
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching) {
      return;
    }
    setIsFetching(true);
  }, [isFetching]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 데이터 로드
  useEffect(() => {
    if (!isFetching || !hasMore || loading) return;
    
    loadMore().finally(() => {
      setIsFetching(false);
    });
  }, [isFetching, hasMore, loading, loadMore]);

  return { isFetching };
};
