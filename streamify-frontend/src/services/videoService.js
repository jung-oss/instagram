// src/services/videoService.js - 비디오 관련 API 서비스
import apiService, { ApiError } from './api';

class VideoService {
  // 비디오 피드 조회
  async getFeed(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type = 'all' // 'all', 'following'
      } = options;

      const endpoint = type === 'following' 
        ? `/api/videos/feed?page=${page}&limit=${limit}&following=true`
        : `/api/videos/feed?page=${page}&limit=${limit}`;

      const response = await apiService.get(endpoint);

      return {
        success: true,
        videos: response.data.videos || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('비디오 피드 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '비디오를 불러올 수 없습니다.',
        videos: [],
        pagination: { page: 1, limit: 10, hasMore: false, total: 0 }
      };
    }
  }

  // 비디오 좋아요 토글
  async toggleLike(videoId) {
    try {
      if (!videoId) {
        throw new ApiError('비디오 ID가 필요합니다.', 400);
      }

      const response = await apiService.post(`/api/videos/${videoId}/like`);

      return {
        success: true,
        liked: response.data.liked,
        likesCount: response.data.likesCount
      };
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '좋아요 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 비디오 업로드
  async uploadVideo(file, metadata, onProgress = null) {
    try {
      if (!file) {
        throw new ApiError('파일이 필요합니다.', 400);
      }

      // 파일 유효성 검사
      const validation = this.validateVideoFile(file);
      if (!validation.isValid) {
        throw new ApiError(validation.error, 400);
      }

      // 메타데이터 유효성 검사
      const metadataValidation = this.validateVideoMetadata(metadata);
      if (!metadataValidation.isValid) {
        throw new ApiError(metadataValidation.errors.join(' '), 400);
      }

      const uploadData = {
        title: metadata.title.trim(),
        description: metadata.description?.trim() || '',
        hashtags: metadata.hashtags?.trim() || '',
        privacy: metadata.isPrivate ? 'private' : 'public'
      };

      const response = await apiService.uploadFile(
        '/api/videos/upload',
        file,
        uploadData,
        onProgress
      );

      return {
        success: true,
        video: response.data.video,
        message: response.data.message || '비디오가 성공적으로 업로드되었습니다.'
      };
    } catch (error) {
      console.error('비디오 업로드 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '비디오 업로드 중 오류가 발생했습니다.'
      };
    }
  }

  // 비디오 삭제
  async deleteVideo(videoId) {
    try {
      if (!videoId) {
        throw new ApiError('비디오 ID가 필요합니다.', 400);
      }

      const response = await apiService.delete(`/api/videos/${videoId}`);

      return {
        success: true,
        message: response.data.message || '비디오가 삭제되었습니다.',
        deletedVideoId: videoId
      };
    } catch (error) {
      console.error('비디오 삭제 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '삭제 권한이 없습니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '비디오 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 비디오 목록 조회
  async getUserVideos(userId = null, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      const endpoint = userId 
        ? `/api/users/${userId}/videos?page=${page}&limit=${limit}`
        : `/api/profile/videos?page=${page}&limit=${limit}`;

      const response = await apiService.get(endpoint);

      return {
        success: true,
        videos: response.data.videos || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('사용자 비디오 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '비디오를 불러올 수 없습니다.',
        videos: [],
        pagination: { page: 1, limit: 10, hasMore: false, total: 0 }
      };
    }
  }

  // 비디오 검색
  async searchVideos(query, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          videos: [],
          pagination: { page: 1, limit: 10, hasMore: false, total: 0 }
        };
      }

      const response = await apiService.get(
        `/api/videos/search?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}`
      );

      return {
        success: true,
        videos: response.data.videos || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('비디오 검색 오류:', error);
      
      return {
        success: false,
        error: error.message || '검색 중 오류가 발생했습니다.',
        videos: [],
        pagination: { page: 1, limit: 10, hasMore: false, total: 0 }
      };
    }
  }

  // 비디오 조회수 증가
  async incrementView(videoId) {
    try {
      if (!videoId) return { success: false };

      await apiService.post(`/api/videos/${videoId}/view`);
      
      return { success: true };
    } catch (error) {
      console.error('조회수 증가 오류:', error);
      return { success: false };
    }
  }

  // 비디오 파일 유효성 검사
  validateVideoFile(file) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    const SUPPORTED_VIDEO_FORMATS = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 
      'video/mov', 'video/wmv', 'video/flv', 'video/mkv'
    ];

    if (!file) {
      return { isValid: false, error: '파일을 선택해주세요.' };
    }

    if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
      return { 
        isValid: false, 
        error: '지원하지 않는 파일 형식입니다. MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV 파일만 업로드 가능합니다.' 
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: '파일 크기가 너무 큽니다. 5GB 이하의 파일만 업로드 가능합니다.' 
      };
    }

    return { isValid: true };
  }

  // 비디오 메타데이터 유효성 검사
  validateVideoMetadata(metadata) {
    const errors = [];
    const { title, description, hashtags } = metadata;

    // 제목 검증
    if (!title || title.trim().length === 0) {
      errors.push('제목을 입력해주세요.');
    } else if (title.trim().length > 100) {
      errors.push('제목은 100자 이하여야 합니다.');
    }

    // 설명 검증 (선택사항)
    if (description && description.trim().length > 1000) {
      errors.push('설명은 1000자 이하여야 합니다.');
    }

    // 해시태그 검증 (선택사항)
    if (hashtags && hashtags.trim().length > 200) {
      errors.push('해시태그는 200자 이하여야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 파일 크기를 읽기 쉬운 형태로 변환
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 비디오 URL 생성
  getVideoUrl(filename) {
    if (!filename) return '';
    return `${apiService.baseURL}/videos/${filename}`;
  }

  // 썸네일 URL 생성
  getThumbnailUrl(filename) {
    if (!filename) return '';
    // 썸네일 파일명 생성 로직 (예: video.mp4 -> video_thumb.jpg)
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    return `${apiService.baseURL}/thumbnails/${nameWithoutExt}_thumb.jpg`;
  }
}

// 싱글톤 인스턴스 생성
const videoService = new VideoService();

export default videoService;