import React from 'react';
import './VideoActions.css';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, VolumeOffIcon, VolumeOnIcon } from '../icons/Icons';

const VideoActions = ({ 
  video, 
  onLike, 
  onGlobalMuteToggle, 
  globalMuted, 
  likingVideos, 
  formatNumber,
  onCommentClick
}) => {
  return (
    <div className="action-buttons">
      <div className="action-btn-wrapper">
        <button 
          className={`action-btn like-btn ${video.isLiked ? 'liked' : ''} ${likingVideos.has(video.id) ? 'loading' : ''}`}
          onClick={() => onLike(video.id)}
          disabled={likingVideos.has(video.id)}
        >
          <HeartIcon />
        </button>
        <span className="action-label">{formatNumber(video.likes)}</span>
      </div>
      
      <div className="action-btn-wrapper">
        <button className="action-btn comment-btn" onClick={onCommentClick}>
          <CommentIcon />
        </button>
        <span className="action-label">{formatNumber(video.comments)}</span>
      </div>
      
      <div className="action-btn-wrapper">
        <button className="action-btn share-btn">
          <ShareIcon />
        </button>
        <span className="action-label">공유</span>
      </div>
      
      <div className="action-btn-wrapper">
        <button className="action-btn bookmark-btn">
          <BookmarkIcon />
        </button>
      </div>

      {/* 전역 음소거 토글 버튼 */}
      <div className="action-btn-wrapper">
        <button 
          className="action-btn mute-btn" 
          onClick={onGlobalMuteToggle}
          title={globalMuted ? "모든 비디오 음성 켜기" : "모든 비디오 음소거"}
        >
          {globalMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
        </button>
        <span className="action-label">{globalMuted ? '음소거' : '음성'}</span>
      </div>
    </div>
  );
};

export default VideoActions; 