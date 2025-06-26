import React from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  video, 
  isActive, 
  globalMuted, 
  onTap, 
  onLoadStart, 
  onError,
  serverUrl 
}) => {
  const isVertical = video.aspectRatio === '9:16';
  const videoUrl = `${serverUrl}${video.url}`;
  
  return (
    <div className={`video-container ${isVertical ? 'vertical' : 'horizontal'}`}>
      <video
        src={videoUrl}
        className="video-player"
        playsInline
        loop
        muted={globalMuted}
        preload="metadata"
        onClick={onTap}
        onLoadStart={() => onLoadStart(video.title)}
        onError={(e) => onError(video.title, e)}
      />
    </div>
  );
};

export default VideoPlayer; 