// src/utils/constants.js - 애플리케이션 상수
export const API_ENDPOINTS = {
    // 인증
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    PROFILE: '/api/profile',
    
    // 비디오
    VIDEO_FEED: '/api/videos/feed',
    VIDEO_UPLOAD: '/api/videos/upload',
    VIDEO_LIKE: (id) => `/api/videos/${id}/like`,
    VIDEO_DELETE: (id) => `/api/videos/${id}`,
    VIDEO_COMMENTS: (id) => `/api/videos/${id}/comments`,
    VIDEO_VIEW: (id) => `/api/videos/${id}/view`,
    VIDEO_SEARCH: '/api/videos/search',
    
    // 사용자
    USER_PROFILE: (id) => `/api/users/${id}`,
    USER_FOLLOW: (id) => `/api/users/${id}/follow`,
    USER_FOLLOWERS: (id) => `/api/users/${id}/followers`,
    USER_FOLLOWING: (id) => `/api/users/${id}/following`,
    USER_VIDEOS: (id) => `/api/users/${id}/videos`,
    USER_SEARCH: '/api/users/search',
    
    // 댓글
    COMMENT_LIKE: (id) => `/api/comments/${id}/like`,
    COMMENT_DELETE: (id) => `/api/comments/${id}`,
    COMMENT_REPLIES: (id) => `/api/comments/${id}/replies`
  };
  
  export const FILE_CONSTRAINTS = {
    MAX_VIDEO_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
    MAX_VIDEO_SIZE_TEXT: '5GB',
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE_SIZE_TEXT: '10MB',
    
    SUPPORTED_VIDEO_FORMATS: [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 
      'video/mov', 'video/wmv', 'video/flv', 'video/mkv',
      'video/x-matroska', 'video/x-msvideo', 'video/x-flv',
      'video/x-ms-wmv', 'video/x-m4v', 'video/3gpp', 
      'video/3gpp2', 'video/quicktime', 'video/mpeg', 'video/x-mpeg'
    ],
    
    SUPPORTED_IMAGE_FORMATS: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
      'image/x-icon', 'image/vnd.microsoft.icon'
    ]
  };
  
  export const UI_CONSTANTS = {
    BOTTOM_NAV_HEIGHT: '80px',
    HEADER_HEIGHT: '60px',
    
    BREAKPOINTS: {
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px',
      large: '1200px'
    },
    
    ANIMATIONS: {
      FAST: '0.15s',
      NORMAL: '0.3s',
      SLOW: '0.5s'
    },
    
    Z_INDEX: {
      MODAL: 10000,
      DROPDOWN: 1000,
      OVERLAY: 100,
      HEADER: 50,
      BOTTOM_NAV: 50
    }
  };
  
  export const VALIDATION_RULES = {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_]+$/
    },
    
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 100
    },
    
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    VIDEO: {
      TITLE_MAX_LENGTH: 100,
      DESCRIPTION_MAX_LENGTH: 1000,
      HASHTAGS_MAX_LENGTH: 200
    },
    
    COMMENT: {
      MAX_LENGTH: 500
    },
    
    FULL_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50
    }
  };
  
  export const APP_CONFIG = {
    DEFAULT_SERVER_URL: process.env.REACT_APP_SERVER_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://your-api-domain.com'),
    
    PAGINATION: {
      DEFAULT_LIMIT: 10,
      VIDEO_LIMIT: 10,
      COMMENT_LIMIT: 20,
      USER_LIMIT: 20
    },
    
    TIMEOUTS: {
      API_TIMEOUT: 30000, // 30초
      DEBOUNCE_DELAY: 300, // 300ms
      CONTROLS_HIDE_DELAY: 3000, // 3초
      LIKE_ANIMATION_DURATION: 1000 // 1초
    }
  };
  
  // src/utils/formatters.js - 데이터 포맷팅 유틸리티
  export const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    
    const number = parseInt(num);
    
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1).replace('.0', '') + 'K';
    }