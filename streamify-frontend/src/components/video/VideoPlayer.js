// src/components/video/VideoPlayer.js - 리팩토링된 비디오 플레이어
import React, { useState, useCallback } from 'react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useAuth } from '../../hooks/useAuth';
import videoService from '../../services/videoService';
import { userService } from '../../services/userService';
import { formatNumber } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import VideoControls from './VideoControls';
import VideoOverlay from './VideoOverlay';
import VideoActions from './VideoActions';
import ShareMenu from './ShareMenu';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  video, 
  isActive, 
  globalMuted, 
  onGlobalMuteToggle,
  onLoginRequired,
  onComment
}) => {
  const { user, isLoggedIn } = useAuth();
  const [likingVideo, setLikingVideo] = useState(false);
  const [followingUser, setFollowingUser] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [videoLiked, setVideoLiked] = useState(video?.isLiked || false);
  const [likesCount, setLikesCount] = useState(video?.likes || 0);
  const [isFollowing, setIsFollowing] = useState(video?.uploader?.isFollowing || false);

  const {
    videoRef,
    isPlaying,
    progress,
    duration,
    currentTime,
    isBuffering,
    showControls,
    showLikeAnimation,
    togglePlay,
    seekTo,
    showControlsTemporarily,
    showLikeAnimationEffect,
    formatTime
  } = useVideoPlayer(video, isActive, globalMuted);

  // 좋아요 처리
  const handleLike = useCallback(async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (likingVideo) return;

    setLikingVideo(true);
    
    try {
      const result = await videoService.toggleLike(video.id);
      
      if (result.success) {
        setVideoLiked(result.liked);
        setLikesCount(result.likesCount);
      } else if (result.requiresAuth) {
        onLoginRequired();
      } else {
        console.error('좋아요 처리 실패:', result.error);
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
    } finally {
      setLikingVideo(false);
    }
  }, [video?.id, isLoggedIn, likingVideo, onLoginRequired]);

  // 더블탭 좋아요
  const handleDoubleTap = useCallback(() => {
    handleLike();
    showLikeAnimationEffect();
  }, [handleLike, showLikeAnimationEffect]);

  // 팔로우 처리
  const handleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (followingUser || !video?.uploader?.id) return;

    setFollowingUser(true);
    
    try {
      const result = await userService.toggleFollow(video.uploader.id);
      
      if (result.success) {
        setIsFollowing(result.following);
      } else if (result.requiresAuth) {
        onLoginRequired();
      } else {
        console.error('팔로우 처리 실패:', result.error);
      }
    } catch (error) {
      console.error('팔로우 처리 오류:', error);
    } finally {
      setFollowingUser(false);
    }
  }, [video?.uploader?.id, isLoggedIn, followingUser, onLoginRequired]);

  // 댓글 처리
  const handleComment = useCallback(() => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    
    if (onComment) {
      onComment(video);
    }
  }, [video, isLoggedIn, onComment, onLoginRequired]);

  // 공유 처리
  const handleShare = useCallback(() => {
    setShowShareMenu(!showShareMenu);
  }, [showShareMenu]);

  // 공유 옵션 처리
  const handleShareOption = useCallback(async (platform) => {
    const videoUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `${video.title} - VideoApp에서 확인하세요!`;
    
    switch (platform) {
      case 'copy':
        const result = await copyToClipboard(videoUrl);
        if (result.success) {
          alert('링크가 복사되었습니다!');
        } else {
          alert('링크 복사에 실패했습니다.');
        }
        break;
        
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`);
        break;
        
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`);
        break;
        
      case 'instagram':
        if (navigator.share) {
          try {
            await navigator.share({
              title: video.title,
              text: shareText,
              url: videoUrl
            });
          } catch (error) {
            console.log('공유 취소 또는 실패:', error);
          }
        } else {
          alert('Instagram 공유는 모바일에서만 가능합니다.');
        }
        break;
        
      default:
        break;
    }
    
    setShowShareMenu(false);
  }, [video]);

  // 진행률 바 클릭 처리
  const handleProgressClick = useCallback((e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    seekTo(percentage);
  }, [seekTo]);

  if (!video) return null;

  return (
    <div className="video-player-container">
      <div 
        className="video-wrapper"
        onClick={showControlsTemporarily}
        onDoubleClick={handleDoubleTap}
      >
        {/* 비디오 엘리먼트 */}
        <video
          ref={videoRef}
          className="video-element"
          src={videoService.getVideoUrl(video.filename)}
          poster={video.thumbnailUrl}
          loop
          playsInline
          muted={globalMuted}
          preload="metadata"
        />
        
        {/* 비디오 컨트롤 */}
        <VideoControls
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          currentTime={currentTime}
          showControls={showControls}
          globalMuted={globalMuted}
          onTogglePlay={togglePlay}
          onProgressClick={handleProgressClick}
          onGlobalMuteToggle={onGlobalMuteToggle}
          formatTime={formatTime}
          isBuffering={isBuffering}
        />
        
        {/* 비디오 오버레이 (정보 표시) */}
        <VideoOverlay
          video={video}
          user={user}
          isFollowing={isFollowing}
          followingUser={followingUser}
          onFollow={handleFollow}
          showLikeAnimation={showLikeAnimation}
        />
        
        {/* 비디오 액션 버튼들 */}
        <VideoActions
          videoLiked={videoLiked}
          likesCount={likesCount}
          commentsCount={video.comments || 0}
          sharesCount={video.shares || 0}
          likingVideo={likingVideo}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          formatNumber={formatNumber}
        />
        
        {/* 공유 메뉴 */}
        {showShareMenu && (
          <ShareMenu
            onShareOption={handleShareOption}
            onClose={() => setShowShareMenu(false)}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;