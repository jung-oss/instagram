// src/components/video/VideoControls.js - 비디오 컨트롤 컴포넌트
import React from 'react';
import { PlayIcon, PauseIcon, VolumeOffIcon, VolumeOnIcon } from '../ui/Icons';

const VideoControls = ({
  isPlaying,
  progress,
  duration,
  currentTime,
  showControls,
  globalMuted,
  onTogglePlay,
  onProgressClick,
  onGlobalMuteToggle,
  formatTime,
  isBuffering
}) => {
  return (
    <>
      {/* 로딩 인디케이터 */}
      {isBuffering && (
        <div className="buffering-indicator">
          <div className="spinner" />
        </div>
      )}
      
      {/* 재생/일시정지 오버레이 */}
      <div className={`play-pause-overlay ${showControls ? 'visible' : ''}`}>
        <button 
          className="play-pause-btn"
          onClick={onTogglePlay}
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <PauseIcon size={48} /> : <PlayIcon size={48} />}
        </button>
      </div>
      
      {/* 비디오 컨트롤 */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        <div className="controls-top">
          <button 
            className="mute-btn"
            onClick={onGlobalMuteToggle}
            aria-label={globalMuted ? '음소거 해제' : '음소거'}
          >
            {globalMuted ? <VolumeOffIcon size={24} /> : <VolumeOnIcon size={24} />}
          </button>
        </div>
        
        <div className="controls-bottom">
          <div className="progress-container">
            <div 
              className="progress-bar" 
              onClick={onProgressClick}
              role="slider"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
              aria-label="비디오 진행률"
            >
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="time-display">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// src/components/video/VideoOverlay.js - 비디오 정보 오버레이
import React from 'react';
import { HeartIcon } from '../ui/Icons';
import { getAvatarUrl } from '../../utils/helpers';

const VideoOverlay = ({
  video,
  user,
  isFollowing,
  followingUser,
  onFollow,
  showLikeAnimation
}) => {
  const canFollow = user && user.id !== video.uploader?.id;

  return (
    <>
      {/* 좋아요 애니메이션 */}
      {showLikeAnimation && (
        <div className="like-animation">
          <HeartIcon size={80} filled={true} />
        </div>
      )}
      
      {/* 비디오 정보 오버레이 */}
      <div className="video-overlay">
        <div className="video-info">
          <div className="uploader-info">
            <img 
              className="uploader-avatar" 
              src={getAvatarUrl(video.uploader)} 
              alt={video.uploader?.username || 'Unknown User'} 
            />
            <div className="uploader-details">
              <div className="uploader-name-row">
                <span className="uploader-name">
                  @{video.uploader?.username || 'unknown'}
                </span>
                {video.uploader?.isVerified && (
                  <span className="verified-badge">✔️</span>
                )}
              </div>
              <div className="uploader-stats">
                팔로워 {video.uploader?.followerCount || 0} · 
                비디오 {video.uploader?.videoCount || 0}
              </div>
            </div>
            
            {/* 팔로우 버튼 */}
            {canFollow && (
              <button 
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={onFollow}
                disabled={followingUser}
              >
                {followingUser ? '처리중...' : isFollowing ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>
          
          {/* 비디오 제목 및 설명 */}
          <div className="video-title">{video.title}</div>
          {video.description && (
            <div className="video-description">{video.description}</div>
          )}
          
          {/* 해시태그 */}
          {video.hashtags && video.hashtags.length > 0 && (
            <div className="hashtags">
              {video.hashtags.map((tag, index) => (
                <span key={index} className="hashtag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* 위치 정보 */}
          {video.location && (
            <div className="video-location">📍 {video.location}</div>
          )}
        </div>
      </div>
    </>
  );
};

// src/components/video/VideoActions.js - 비디오 액션 버튼들
import React from 'react';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from '../ui/Icons';

const VideoActions = ({
  videoLiked,
  likesCount,
  commentsCount,
  sharesCount,
  likingVideo,
  onLike,
  onComment,
  onShare,
  formatNumber
}) => {
  return (
    <div className="action-buttons">
      {/* 좋아요 버튼 */}
      <div className="action-btn-group">
        <button 
          className={`action-btn ${videoLiked ? 'liked' : ''}`}
          onClick={onLike}
          disabled={likingVideo}
          aria-label={videoLiked ? '좋아요 취소' : '좋아요'}
        >
          <HeartIcon size={32} filled={videoLiked} />
        </button>
        <span className="action-count">{formatNumber(likesCount)}</span>
        <span className="action-label">좋아요</span>
      </div>
      
      {/* 댓글 버튼 */}
      <div className="action-btn-group">
        <button 
          className="action-btn"
          onClick={onComment}
          aria-label="댓글"
        >
          <CommentIcon size={32} />
        </button>
        <span className="action-count">{formatNumber(commentsCount)}</span>
        <span className="action-label">댓글</span>
      </div>
      
      {/* 공유 버튼 */}
      <div className="action-btn-group">
        <button 
          className="action-btn"
          onClick={onShare}
          aria-label="공유"
        >
          <ShareIcon size={32} />
        </button>
        <span className="action-count">{formatNumber(sharesCount)}</span>
        <span className="action-label">공유</span>
      </div>
      
      {/* 북마크 버튼 */}
      <div className="action-btn-group">
        <button 
          className="action-btn"
          aria-label="북마크"
        >
          <BookmarkIcon size={32} />
        </button>
        <span className="action-count">0</span>
        <span className="action-label">저장</span>
      </div>
    </div>
  );
};

// src/components/video/ShareMenu.js - 공유 메뉴 컴포넌트
import React, { useEffect, useRef } from 'react';

const ShareMenu = ({ onShareOption, onClose }) => {
  const menuRef = useRef(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const shareOptions = [
    { id: 'copy', label: '링크 복사', icon: '🔗' },
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📷' }
  ];

  return (
    <div className="share-menu" ref={menuRef}>
      {shareOptions.map(option => (
        <button
          key={option.id}
          className="share-option"
          onClick={() => onShareOption(option.id)}
        >
          <span className="share-icon">{option.icon}</span>
          <span className="share-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export { VideoControls, VideoOverlay, VideoActions, ShareMenu };
export default { VideoControls, VideoOverlay, VideoActions, ShareMenu };