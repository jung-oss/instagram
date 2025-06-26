import React, { useState } from 'react';
import './VideoInfo.css';

const VideoInfo = ({ video, isAuthenticated, formatNumber, serverUrl, token, currentUserId, onFollowUpdate, onUserClick }) => {
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(video.isFollowingUploader || false);

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(video.uploaderId);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !token || video.uploaderId === currentUserId) return;
    
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${serverUrl}/api/users/${video.uploaderId}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setIsFollowing(!isFollowing);
        if (onFollowUpdate) {
          onFollowUpdate(video.uploaderId, !isFollowing);
        }
      }
    } catch (e) {
      console.error('팔로우 처리 실패:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="video-info">
      <div className="user-info">
        <img 
          src={video.uploaderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.uploader}`}
          alt={video.uploader}
          className="avatar"
          onClick={handleUserClick}
        />
        <div className="user-details" onClick={handleUserClick}>
          <div className="username-row">
            <span className="username">@{video.uploader}</span>
            {video.uploaderVerified && (
              <svg className="verified-badge" viewBox="0 0 24 24" fill="#1d9bf0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            )}
          </div>
          <span className="upload-time">{video.createdAt}</span>
        </div>
        {isAuthenticated && video.uploaderId !== currentUserId && (
          <button 
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? '처리중...' : isFollowing ? '언팔로우' : '팔로우'}
          </button>
        )}
      </div>
      
      <div className="description">
        <p>{video.description}</p>
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="hashtags">
            {video.hashtags.map((tag, index) => (
              <span key={index} className="hashtag">
                {tag}
              </span>
            ))}
          </div>
        )}
        {video.location && (
          <div className="location">
            <svg viewBox="0 0 24 24" fill="white" width="12" height="12">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>{video.location}</span>
          </div>
        )}
      </div>
      
      <div className="meta-info">
        <span className="views">👁️ {formatNumber(video.views)} views</span>
      </div>
    </div>
  );
};

export default VideoInfo; 