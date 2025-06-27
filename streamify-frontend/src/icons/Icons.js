// components/icons/Icons.js - 통일된 아이콘 시스템

import React from 'react';

// 기본 아이콘 Props 타입
const iconProps = {
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

// 홈 아이콘
export const HomeIcon = ({ size = 24, filled = false, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

// 검색 아이콘
export const SearchIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

// 하트 아이콘 (좋아요)
export const HeartIcon = ({ size = 24, filled = false, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// 댓글 아이콘
export const CommentIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// 공유 아이콘
export const ShareIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16,6 12,2 8,6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

// 북마크 아이콘
export const BookmarkIcon = ({ size = 24, filled = false, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  >
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-3 7 3z"/>
  </svg>
);

// 사용자 아이콘
export const UserIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// 플러스 아이콘 (업로드)
export const PlusIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// 설정 아이콘
export const SettingsIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// X 아이콘 (닫기)
export const XIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// 재생 아이콘
export const PlayIcon = ({ size = 24, filled = true, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  >
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

// 일시정지 아이콘
export const PauseIcon = ({ size = 24, filled = true, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  >
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

// 음소거 아이콘
export const VolumeOffIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);

// 음성 아이콘
export const VolumeOnIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

// 로그아웃 아이콘
export const LogOutIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// 눈 아이콘 (비밀번호 보기)
export const EyeIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// 눈 감기 아이콘 (비밀번호 숨기기)
export const EyeOffIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// 체크 아이콘
export const CheckIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

// 경고 아이콘
export const AlertIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// 다운로드 아이콘
export const DownloadIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// 업로드 아이콘
export const UploadIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"/>
    <polyline points="17,8 12,3 7,8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

// 더보기 아이콘 (점 3개)
export const MoreIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

// 화살표 (위)
export const ArrowUpIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5,12 12,5 19,12"/>
  </svg>
);

// 화살표 (아래)
export const ArrowDownIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="5,12 12,19 19,12"/>
  </svg>
);

// 새로고침 아이콘
export const RefreshIcon = ({ size = 24, ...props }) => (
  <svg 
    {...iconProps} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    {...props}
  >
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
