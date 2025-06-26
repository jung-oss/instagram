// 숫자 포맷팅 함수
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// 시간 계산 함수
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
};

// 파일 업로드 관련 상수
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const MAX_FILE_SIZE_TEXT = '5GB';

// 지원하는 비디오 형식
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
  'video/wmv', 'video/flv', 'video/mkv', 'video/x-matroska', 'video/x-msvideo',
  'video/x-flv', 'video/x-ms-wmv', 'video/x-m4v', 'video/3gpp', 'video/3gpp2',
  'video/quicktime', 'video/mpeg', 'video/x-mpeg'
];

// 지원하는 이미지 형식
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/bmp', 'image/tiff', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'
];

// 지원하는 모든 파일 형식
export const SUPPORTED_FORMATS = [
  ...SUPPORTED_VIDEO_FORMATS,
  ...SUPPORTED_IMAGE_FORMATS
];

// 파일 형식별 확장자 매핑
export const FILE_EXTENSIONS = {
  // 비디오
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'video/avi': '.avi',
  'video/mov': '.mov',
  'video/wmv': '.wmv',
  'video/flv': '.flv',
  'video/mkv': '.mkv',
  'video/m4v': '.m4v',
  'video/3gp': '.3gp',
  'video/ts': '.ts',
  'video/mts': '.mts',
  'video/m2ts': '.m2ts',
  // 이미지
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/svg+xml': '.svg'
};

// 파일 형식 검증 함수
export const isValidFileType = (file) => {
  return SUPPORTED_FORMATS.includes(file.type);
};

// 파일 크기 검증 함수
export const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

// 파일 형식별 아이콘 반환
export const getFileTypeIcon = (mimeType) => {
  if (SUPPORTED_VIDEO_FORMATS.includes(mimeType)) {
    return '🎬';
  } else if (SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    return '🖼️';
  }
  return '📄';
};

// 파일 형식별 설명 반환
export const getFileTypeDescription = (mimeType) => {
  if (SUPPORTED_VIDEO_FORMATS.includes(mimeType)) {
    return '비디오 파일';
  } else if (SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    return '이미지 파일';
  }
  return '지원하지 않는 파일 형식';
};

// 지원하는 파일 형식 목록을 문자열로 반환
export const getSupportedFormatsText = () => {
  const videoFormats = ['MP4', 'WebM', 'OGG', 'AVI', 'MOV', 'WMV', 'FLV', 'MKV', 'M4V', '3GP', 'TS', 'MTS', 'M2TS'];
  const imageFormats = ['JPEG', 'PNG', 'GIF', 'WebP', 'BMP', 'TIFF', 'SVG'];
  
  return `비디오: ${videoFormats.join(', ')}\n이미지: ${imageFormats.join(', ')}`;
};

// 파일 크기를 읽기 쉬운 형태로 변환
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일명에서 확장자 추출
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// 안전한 파일명 생성
export const generateSafeFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(originalName) || '';
  
  return `file-${timestamp}-${random}${ext}`;
};

// 비디오 품질 옵션
export const VIDEO_QUALITY_OPTIONS = [
  { value: 'auto', label: '자동', description: '네트워크에 따라 자동 조절' },
  { value: '1080p', label: '1080p', description: '고화질 (데이터 사용량 많음)' },
  { value: '720p', label: '720p', description: '중간 화질 (권장)' },
  { value: '480p', label: '480p', description: '저화질 (데이터 절약)' },
  { value: '360p', label: '360p', description: '최저 화질 (최대 절약)' }
];

// 비디오 품질별 해상도 매핑
export const QUALITY_RESOLUTIONS = {
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '360p': { width: 640, height: 360 }
};

// 공개 설정 옵션
export const PRIVACY_OPTIONS = [
  { value: 'public', label: '공개', description: '모든 사용자가 볼 수 있음' },
  { value: 'private', label: '비공개', description: '나만 볼 수 있음' },
  { value: 'followers', label: '팔로워만', description: '팔로워만 볼 수 있음' }
];

// 해시태그 추출 함수
export const extractHashtags = (text) => {
  const hashtagRegex = /#[\w가-힣]+/g;
  return text.match(hashtagRegex) || [];
};

// 해시태그 제거 함수
export const removeHashtags = (text) => {
  return text.replace(/#[\w가-힣]+/g, '').trim();
};

// 유효한 파일 타입 확인
export const isValidVideoFile = (file) => {
  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ];
  return validTypes.includes(file.type);
};

// 파일명 안전화
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9가-힣\s\-_\.]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}; 