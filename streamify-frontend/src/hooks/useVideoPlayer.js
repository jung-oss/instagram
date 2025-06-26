import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoPlayer = (videos, globalMuted) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [likeAnimations, setLikeAnimations] = useState({});
  const videoRefs = useRef({});
  const observerRef = useRef(null);

  // Intersection Observer 설정
  const setupVideoObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          const videoId = entry.target.dataset.videoId;
          const video = entry.target.querySelector('video');
          
          if (!video) return;

          if (entry.intersectionRatio >= 0.7) {
            setActiveVideo(videoId);
            
            try {
              video.muted = globalMuted;
              await new Promise(resolve => setTimeout(resolve, 100));
              await video.play();
            } catch (error) {
              console.log(`비디오 재생 실패 (${videoId}):`, error.message);
            }
          } else if (entry.intersectionRatio <= 0.3) {
            try {
              video.pause();
            } catch (error) {
              console.log(`비디오 일시정지 실패 (${videoId}):`, error.message);
            }
          }
        });
      },
      {
        threshold: [0.3, 0.7],
        rootMargin: '0px'
      }
    );

    Object.values(videoRefs.current).forEach(ref => {
      if (ref) observerRef.current.observe(ref);
    });
  }, [globalMuted]);

  // 전역 음소거 상태 변경시 모든 비디오에 적용
  useEffect(() => {
    Object.values(videoRefs.current).forEach(ref => {
      if (ref) {
        const videoElement = ref.querySelector('video');
        if (videoElement) {
          videoElement.muted = globalMuted;
        }
      }
    });
  }, [globalMuted]);

  // Observer 설정
  useEffect(() => {
    setupVideoObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos, setupVideoObserver]);

  // 좋아요 애니메이션
  const triggerLikeAnimation = useCallback((videoId) => {
    setLikeAnimations(prev => ({ ...prev, [videoId]: true }));
    setTimeout(() => {
      setLikeAnimations(prev => ({ ...prev, [videoId]: false }));
    }, 600);
  }, []);

  return {
    activeVideo,
    likeAnimations,
    videoRefs,
    triggerLikeAnimation
  };
}; 