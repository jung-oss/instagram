// components/VideoPlayer.js - 개선된 비디오 플레이어
import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartIcon, 
  CommentIcon, 
  ShareIcon, 
  BookmarkIcon, 
  PlayIcon, 
  PauseIcon,
  VolumeOffIcon,
  VolumeOnIcon,
  MoreIcon
} from './icons/Icons';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  video, 
  isActive, 
  globalMuted, 
  onLike, 
  onFollow, 
  onComment, 
  onGlobalMuteToggle,
  likingVideos,
  followingUsers,
  formatNumber,
  user,
  onLoginRequired 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const likeAnimationTimeoutRef = useRef(null);

  // 비디오 이벤트 처리
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      setProgress((videoElement.currentTime / videoElement.duration) * 100);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 활성 비디오 자동 재생
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch(error => {
        console.log('자동 재생 실패:', error);
      });
    } else {
      videoElement.pause();
    }
  }, [isActive]);

  // 전역 음소거 설정
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  // 비디오 토글 (재생/일시정지)
  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch(error => {
        console.log('재생 실패:', error);
      });
    }
  };

  // 더블탭 좋아요
  const handleDoubleTap = () => {
    if (!user) {
      onLoginRequired();
      return;
    }

    handleLike();
    showLikeAnimationEffect();
  };

  // 좋아요 처리
  const handleLike = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    onLike(video.id);
  };

  // 좋아요 애니메이션 효과
  const showLikeAnimationEffect = () => {
    setShowLikeAnimation(true);
    
    if (likeAnimationTimeoutRef.current) {
      clearTimeout(likeAnimationTimeoutRef.current);
    }
    
    likeAnimationTimeoutRef.current = setTimeout(() => {
      setShowLikeAnimation(false);
    }, 1000);
  };

  // 팔로우 처리
  const handleFollow = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    onFollow(video.uploaderId);
  };

  // 댓글 처리
  const handleComment = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    onComment(video);
  };

  // 공유 처리
  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  // 공유 옵션 처리
  const handleShareOption = async (platform) => {
    const videoUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `${video.title} - VideoApp에서 확인하세요!`;
    
    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(videoUrl);
          alert('링크가 복사되었습니다!');
        } catch (error) {
          console.error('링크 복사 실패:', error);
        }
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`);
        break;
      case 'instagram':
        // Instagram 공유는 모바일에서만 가능
        if (navigator.share) {
          navigator.share({
            title: video.title,
            text: shareText,
            url: videoUrl
          });
        } else {
          alert('Instagram 공유는 모바일에서만 가능합니다.');
        }
        break;
      default:
        break;
    }
    
    setShowShareMenu(false);
  };

  // 진행률 바 클릭 처리
  const handleProgressClick = (e) => {
    const progressBar = progressRef.current;
    if (!progressBar || !videoRef.current) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
  };

  // 컨트롤 표시/숨김 처리
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // 시간 포맷팅
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current);
      }
    };
  }, []);

  if (!video) return null;

  return (
    <div className="video-player-container">
      <div 
        className="video-wrapper"
        onClick={showControlsTemporarily}
        onDoubleClick={handleDoubleTap}
      >
        <video
          ref={videoRef}
          className="video-element"
          src={`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/videos/${video.filename}`}
          poster={video.thumbnailUrl}
          loop
          playsInline
          muted={globalMuted}
          preload="metadata"
        />
        
        {/* 로딩 인디케이터 */}
        {isBuffering && (
          <div className="buffering-indicator">
            <div className="spinner" />
          </div>
        )}
        
        {/* 재생/일시정지 버튼 */}
        <div className={`play-pause-overlay ${showControls ? 'visible' : ''}`}>
          <button 
            className="play-pause-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? <PauseIcon size={48} /> : <PlayIcon size={48} />}
          </button>
        </div>
        
        {/* 좋아요 애니메이션 */}
        {showLikeAnimation && (
          <div className="like-animation">
            <HeartIcon size={80} filled={true} />
          </div>
        )}
        
        {/* 비디오 컨트롤 */}
        <div className={`video-controls ${showControls ? 'visible' : ''}`}>
          <div className="controls-top">
            <button 
              className="mute-btn"
              onClick={onGlobalMuteToggle}
              aria-label={globalMuted ? '음성 켜기' : '음소거'}
            >
              {globalMuted ? <VolumeOffIcon size={24} /> : <VolumeOnIcon size={24} />}
            </button>
          </div>
          
          <div className="controls-bottom">
            <div className="progress-container">
              <div 
                ref={progressRef}
                className="progress-bar"
                onClick={handleProgressClick}
              >
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 비디오 오버레이 */}
        <div className="video-overlay">
          {/* 비디오 정보 */}
          <div className="video-info">
            <h3 className="video-title">{video.title}</h3>
            {video.description && (
              <p className="video-description">{video.description}</p>
            )}
            
            {/* 해시태그 */}
            {video.hashtags && video.hashtags.length > 0 && (
              <div className="hashtags">
                {video.hashtags.map((tag, index) => (
                  <span key={index} className="hashtag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 업로더 정보 */}
            <div className="uploader-info">
              <img 
                src={video.uploaderAvatar || '/default-avatar.png'} 
                alt={video.uploader}
                className="uploader-avatar"
              />
              <div className="uploader-details">
                <div className="uploader-name">@{video.uploader}</div>
                <div className="uploader-stats">
                  팔로워 {formatNumber(video.uploaderFollowers)} • 
                  조회수 {formatNumber(video.views)}
                </div>
              </div>
              
              {user && user.username !== video.uploader && (
                <button 
                  className={`follow-btn ${video.isFollowingUploader ? 'following' : ''} ${followingUsers.has(video.uploaderId) ? 'loading' : ''}`}
                  onClick={handleFollow}
                  disabled={followingUsers.has(video.uploaderId)}
                >
                  {followingUsers.has(video.uploaderId) ? (
                    <div className="btn-spinner" />
                  ) : (
                    video.isFollowingUploader ? '팔로잉' : '팔로우'
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="action-buttons">
            {/* 좋아요 */}
            <div className="action-group">
              <button 
                className={`action-btn like-btn ${video.isLiked ? 'liked' : ''} ${likingVideos.has(video.id) ? 'loading' : ''}`}
                onClick={handleLike}
                disabled={likingVideos.has(video.id)}
                aria-label="좋아요"
              >
                <HeartIcon size={28} filled={video.isLiked} />
                {likingVideos.has(video.id) && <div className="btn-spinner" />}
              </button>
              <span className="action-count">{formatNumber(video.likes)}</span>
            </div>
            
            {/* 댓글 */}
            <div className="action-group">
              <button 
                className="action-btn comment-btn"
                onClick={handleComment}
                aria-label="댓글"
              >
                <CommentIcon size={28} />
              </button>
              <span className="action-count">{formatNumber(video.comments)}</span>
            </div>
            
            {/* 공유 */}
            <div className="action-group">
              <button 
                className="action-btn share-btn"
                onClick={handleShare}
                aria-label="공유"
              >
                <ShareIcon size={28} />
              </button>
              <span className="action-label">공유</span>
              
              {/* 공유 메뉴 */}
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={() => handleShareOption('copy')}>
                    링크 복사
                  </button>
                  <button onClick={() => handleShareOption('twitter')}>
                    Twitter
                  </button>
                  <button onClick={() => handleShareOption('facebook')}>
                    Facebook
                  </button>
                  <button onClick={() => handleShareOption('instagram')}>
                    Instagram
                  </button>
                </div>
              )}
            </div>
            
            {/* 북마크 */}
            <div className="action-group">
              <button 
                className="action-btn bookmark-btn"
                onClick={() => {
                  if (!user) {
                    onLoginRequired();
                    return;
                  }
                  // 북마크 로직 구현
                }}
                aria-label="북마크"
              >
                <BookmarkIcon size={28} />
              </button>
              <span className="action-label">저장</span>
            </div>
            
            {/* 더보기 */}
            <div className="action-group">
              <button 
                className="action-btn more-btn"
                onClick={() => {
                  // 더보기 메뉴 구현
                }}
                aria-label="더보기"
              >
                <MoreIcon size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;