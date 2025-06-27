// src/services/userService.js - 사용자 관련 API 서비스
import apiService, { ApiError } from './api';

class UserService {
  // 사용자 프로필 조회
  async getUserProfile(userId = null) {
    try {
      const endpoint = userId ? `/api/users/${userId}` : '/api/profile';
      const response = await apiService.get(endpoint);

      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '사용자 정보를 불러올 수 없습니다.'
      };
    }
  }

  // 팔로우/언팔로우 토글
  async toggleFollow(userId) {
    try {
      if (!userId) {
        throw new ApiError('사용자 ID가 필요합니다.', 400);
      }

      const response = await apiService.post(`/api/users/${userId}/follow`);

      return {
        success: true,
        following: response.data.following,
        followerCount: response.data.followerCount
      };
    } catch (error) {
      console.error('팔로우 토글 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '팔로우 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 팔로워 목록 조회
  async getFollowers(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      const response = await apiService.get(
        `/api/users/${userId}/followers?page=${page}&limit=${limit}`
      );

      return {
        success: true,
        followers: response.data.followers || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('팔로워 목록 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '팔로워 목록을 불러올 수 없습니다.',
        followers: [],
        pagination: { page: 1, limit: 20, hasMore: false, total: 0 }
      };
    }
  }

  // 팔로잉 목록 조회
  async getFollowing(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      const response = await apiService.get(
        `/api/users/${userId}/following?page=${page}&limit=${limit}`
      );

      return {
        success: true,
        following: response.data.following || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('팔로잉 목록 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '팔로잉 목록을 불러올 수 없습니다.',
        following: [],
        pagination: { page: 1, limit: 20, hasMore: false, total: 0 }
      };
    }
  }

  // 사용자 검색
  async searchUsers(query, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          users: [],
          pagination: { page: 1, limit: 20, hasMore: false, total: 0 }
        };
      }

      const response = await apiService.get(
        `/api/users/search?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}`
      );

      return {
        success: true,
        users: response.data.users || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('사용자 검색 오류:', error);
      
      return {
        success: false,
        error: error.message || '사용자 검색 중 오류가 발생했습니다.',
        users: [],
        pagination: { page: 1, limit: 20, hasMore: false, total: 0 }
      };
    }
  }

  // 사용자 아바타 URL 생성
  getAvatarUrl(user) {
    if (!user) return '';
    
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    
    // 기본 아바타 (Dicebear API 사용)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.id}`;
  }
}

// src/services/commentService.js - 댓글 관련 API 서비스
class CommentService {
  // 댓글 목록 조회
  async getComments(videoId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      if (!videoId) {
        throw new ApiError('비디오 ID가 필요합니다.', 400);
      }

      const response = await apiService.get(
        `/api/videos/${videoId}/comments?page=${page}&limit=${limit}`
      );

      return {
        success: true,
        comments: response.data.comments || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '댓글을 불러올 수 없습니다.',
        comments: [],
        pagination: { page: 1, limit: 20, hasMore: false, total: 0 }
      };
    }
  }

  // 댓글 작성
  async createComment(videoId, content, parentCommentId = null) {
    try {
      if (!videoId) {
        throw new ApiError('비디오 ID가 필요합니다.', 400);
      }

      if (!content || content.trim().length === 0) {
        throw new ApiError('댓글 내용을 입력해주세요.', 400);
      }

      if (content.trim().length > 500) {
        throw new ApiError('댓글은 500자 이하여야 합니다.', 400);
      }

      const response = await apiService.post(`/api/videos/${videoId}/comments`, {
        content: content.trim(),
        parentCommentId
      });

      return {
        success: true,
        comment: response.data.comment,
        message: response.data.message || '댓글이 작성되었습니다.'
      };
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '댓글 작성 중 오류가 발생했습니다.'
      };
    }
  }

  // 댓글 삭제
  async deleteComment(commentId) {
    try {
      if (!commentId) {
        throw new ApiError('댓글 ID가 필요합니다.', 400);
      }

      const response = await apiService.delete(`/api/comments/${commentId}`);

      return {
        success: true,
        message: response.data.message || '댓글이 삭제되었습니다.',
        deletedCommentId: commentId
      };
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      
      if (error instanceof ApiError && error.isAuthError()) {
        return {
          success: false,
          error: '삭제 권한이 없습니다.',
          requiresAuth: true
        };
      }
      
      return {
        success: false,
        error: error.message || '댓글 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 댓글 좋아요 토글
  async toggleCommentLike(commentId) {
    try {
      if (!commentId) {
        throw new ApiError('댓글 ID가 필요합니다.', 400);
      }

      const response = await apiService.post(`/api/comments/${commentId}/like`);

      return {
        success: true,
        liked: response.data.liked,
        likesCount: response.data.likesCount
      };
    } catch (error) {
      console.error('댓글 좋아요 토글 오류:', error);
      
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

  // 대댓글 조회
  async getReplies(commentId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      if (!commentId) {
        throw new ApiError('댓글 ID가 필요합니다.', 400);
      }

      const response = await apiService.get(
        `/api/comments/${commentId}/replies?page=${page}&limit=${limit}`
      );

      return {
        success: true,
        replies: response.data.replies || [],
        pagination: response.data.pagination || {
          page,
          limit,
          hasMore: false,
          total: 0
        }
      };
    } catch (error) {
      console.error('대댓글 조회 오류:', error);
      
      return {
        success: false,
        error: error.message || '대댓글을 불러올 수 없습니다.',
        replies: [],
        pagination: { page: 1, limit: 10, hasMore: false, total: 0 }
      };
    }
  }

  // 댓글 내용 유효성 검사
  validateComment(content) {
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: '댓글 내용을 입력해주세요.'
      };
    }

    if (content.trim().length > 500) {
      return {
        isValid: false,
        error: '댓글은 500자 이하여야 합니다.'
      };
    }

    return { isValid: true };
  }
}

// 싱글톤 인스턴스 생성
const userService = new UserService();
const commentService = new CommentService();

export { userService, commentService };
export default { userService, commentService };