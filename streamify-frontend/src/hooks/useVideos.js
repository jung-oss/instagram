// src/hooks/useVideos.js - 비디오 목록 관리 커스텀 훅
import { useState, useCallback } from 'react';
import videoService from '../services/videoService';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    hasMore: true,
    total: 0
  });

  // 비디오 목록 로드
  const loadVideos = useCallback(async (page = 1, reset = false, type = 'all') => {
    setLoading(true);
    setError('');

    const result = await videoService.getFeed({ page, limit: pagination.limit, type });

    if (result.success) {
      setVideos(prevVideos => 
        reset ? result.videos : [...prevVideos, ...result.videos]
      );
      setPagination(result.pagination);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result.success;
  }, [pagination.limit]);

  // 비디오 좋아요 토글
  const toggleVideoLike = useCallback(async (videoId) => {
    const result = await videoService.toggleLike(videoId);

    if (result.success) {
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? {
                ...video,
                isLiked: result.liked,
                likes: result.likesCount
              }
            : video
        )
      );
    }

    return result;
  }, []);

  // 비디오 삭제
  const deleteVideo = useCallback(async (videoId) => {
    const result = await videoService.deleteVideo(videoId);

    if (result.success) {
      setVideos(prevVideos =>
        prevVideos.filter(video => video.id !== videoId)
      );
    }

    return result;
  }, []);

  // 비디오 업로드
  const uploadVideo = useCallback(async (file, metadata, onProgress) => {
    const result = await videoService.uploadVideo(file, metadata, onProgress);

    if (result.success && result.video) {
      setVideos(prevVideos => [result.video, ...prevVideos]);
    }

    return result;
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // 페이지 리셋
  const resetPagination = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: 1,
      hasMore: true
    }));
  }, []);

  return {
    videos,
    loading,
    error,
    pagination,
    loadVideos,
    toggleVideoLike,
    deleteVideo,
    uploadVideo,
    clearError,
    resetPagination,
    setVideos
  };
};
