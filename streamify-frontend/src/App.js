// App.js - 완전히 개선된 버전
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import VideoPlayer from './components/VideoPlayer';
import AuthModal from './components/AuthModal';
import UploadModal from './components/UploadModal';
import CommentModal from './components/CommentModal';
import SearchPage from './components/SearchPage';
import ProfilePage from './components/ProfilePage';
import { 
  PlusIcon, 
  SettingsIcon, 
  UserIcon, 
  LogOutIcon, 
  HomeIcon, 
  SearchIcon, 
  HeartIcon 
} from './icons/Icons';

// 개발 환경 에러 핸들링
if (process.env.NODE_ENV === 'development' && window.ResizeObserver) {
  const roError = (e) => {
    if (e.message && e.message.includes('ResizeObserver loop')) {
      e.preventDefault();
      return false;
    }
    return true;
  };
  window.addEventListener('error', roError);
}

const App = () => {
  // 기본 상태들
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [globalMuted, setGlobalMuted] = useState(true);

  // 인증 관련 상태
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 모달 상태들
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeVideoForComments, setActiveVideoForComments] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // 인터랙션 상태들
  const [likingVideos, setLikingVideos] = useState(new Set());
  const [followingUsers, setFollowingUsers] = useState(new Set());

  // 페이지네이션 및 스크롤
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const videoContainerRef = useRef(null);

  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`);

  // 토큰 검증
  const verifyToken = useCallback(async (tokenToVerify) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthError('');
        return true;
      } else {
        handleTokenExpired();
        return false;
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      handleTokenExpired();
      return false;
    }
  }, [SERVER_URL]);

  // 토큰 만료 처리
  const handleTokenExpired = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthError('로그인이 만료되었습니다. 다시 로그인해주세요.');
  };

  // 비디오 피드 로드
  const loadVideos = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      let endpoint = '/api/videos/feed';
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10
      });
      
      if (activeTab === 'follow' && token) {
        params.set('following', 'true');
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${SERVER_URL}${endpoint}?${params}`, { 
        headers 
      });
      
      const data = await response.json();

      if (response.ok) {
        const newVideos = data.videos || [];
        
        if (reset || pageNum === 1) {
          setVideos(newVideos);
          setCurrentVideoIndex(0);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setError('');
      } else {
        if (response.status === 401) {
          handleTokenExpired();
        } else {
          setError(data.error || '비디오를 불러오는데 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('비디오 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [SERVER_URL, activeTab, token]);

  // 로그인 처리
  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        const newToken = data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // 사용자 정보 설정
        if (data.user) {
          setUser(data.user);
        } else {
          await verifyToken(newToken);
        }
        
        setShowAuthModal(false);
        setAuthError('');
        
        // 비디오 다시 로드 (인증된 상태에서)
        loadVideos(1, true);
        
        return true;
      } else {
        setAuthError(data.error || '로그인에 실패했습니다.');
        return false;
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setAuthError('네트워크 오류가 발생했습니다.');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (userData) => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setAuthError('');
        // 회원가입 후 자동 로그인
        return await handleLogin({
          username: userData.username,
          password: userData.password
        });
      } else {
        setAuthError(data.error || '회원가입에 실패했습니다.');
        return false;
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setAuthError('네트워크 오류가 발생했습니다.');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthError('');
    setActiveTab('home');
    loadVideos(1, true);
  };

  // 좋아요 토글
  const handleLike = async (videoId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (likingVideos.has(videoId)) return;

    setLikingVideos(prev => new Set([...prev, videoId]));

    try {
      const response = await fetch(`${SERVER_URL}/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                isLiked: data.liked,
                likes: data.likesCount 
              }
            : video
        ));
      } else {
        if (response.status === 401) {
          handleTokenExpired();
        }
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
    } finally {
      setLikingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  // 팔로우 토글
  const handleFollow = async (userId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (followingUsers.has(userId)) return;

    setFollowingUsers(prev => new Set([...prev, userId]));

    try {
      const response = await fetch(`${SERVER_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        setVideos(prev => prev.map(video => 
          video.uploaderId === userId 
            ? { 
                ...video, 
                isFollowingUploader: data.isFollowing,
                uploaderFollowers: data.followerCount 
              }
            : video
        ));
      } else {
        if (response.status === 401) {
          handleTokenExpired();
        }
      }
    } catch (error) {
      console.error('팔로우 오류:', error);
    } finally {
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // 댓글 모달 열기
  const handleOpenComments = (video) => {
    setActiveVideoForComments(video);
    setShowCommentsModal(true);
  };

  // 업로드 성공 처리
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadVideos(1, true);
  };

  // 비디오 스크롤 처리
  const handleVideoScroll = (direction) => {
    if (direction === 'next' && currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      
      // 마지막 3개 비디오에 도달하면 더 로드
      if (currentVideoIndex >= videos.length - 3 && hasMore) {
        setPage(prev => prev + 1);
        loadVideos(page + 1, false);
      }
    } else if (direction === 'prev' && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  };

  // 숫자 포맷팅
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  // 초기화
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, [verifyToken]);

  // 탭 변경 시 비디오 로드
  useEffect(() => {
    if (token !== null) { // 토큰 검증이 완료된 후에만 로드
      setPage(1);
      loadVideos(1, true);
    }
  }, [activeTab, token, loadVideos]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab === 'home') {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handleVideoScroll('prev');
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleVideoScroll('next');
            break;
          case ' ':
            e.preventDefault();
            // 스페이스바로 재생/일시정지 (VideoPlayer에서 처리)
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            setGlobalMuted(prev => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleVideoScroll]);

  // 메인 콘텐츠 렌더링
  const renderMainContent = () => {
    if (activeTab === 'search') {
      return (
        <SearchPage 
          serverUrl={SERVER_URL}
          token={token}
          user={user}
          onVideoSelect={(video) => {
            // 검색에서 비디오 선택 시 홈으로 이동하고 해당 비디오 재생
            setActiveTab('home');
            setVideos([video]);
            setCurrentVideoIndex(0);
          }}
        />
      );
    }

    if (activeTab === 'profile') {
      return (
        <ProfilePage 
          serverUrl={SERVER_URL}
          token={token}
          user={user}
          onVideoSelect={(video) => {
            setActiveTab('home');
            setVideos([video]);
            setCurrentVideoIndex(0);
          }}
        />
      );
    }

    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>비디오를 불러오는 중...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => {
              setError('');
              setPage(1);
              loadVideos(1, true);
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div className="empty-container">
          <div className="empty-icon">📹</div>
          <h3>비디오가 없습니다</h3>
          <p>
            {activeTab === 'follow' 
              ? '팔로우한 사용자들의 비디오가 없습니다. 새로운 크리에이터를 팔로우해보세요!'
              : '아직 업로드된 비디오가 없습니다. 첫 번째 비디오를 업로드해보세요!'
            }
          </p>
          {user && (
            <button 
              className="upload-btn-cta"
              onClick={() => setShowUploadModal(true)}
            >
              <PlusIcon />
              비디오 업로드
            </button>
          )}
        </div>
      );
    }

    // 메인 비디오 피드
    return (
      <div className="video-feed" ref={videoContainerRef}>
        <VideoPlayer
          video={videos[currentVideoIndex]}
          isActive={true}
          globalMuted={globalMuted}
          onLike={handleLike}
          onFollow={handleFollow}
          onComment={handleOpenComments}
          onGlobalMuteToggle={() => setGlobalMuted(prev => !prev)}
          likingVideos={likingVideos}
          followingUsers={followingUsers}
          formatNumber={formatNumber}
          user={user}
          onLoginRequired={() => setShowAuthModal(true)}
        />
        
        {/* 비디오 네비게이션 인디케이터 */}
        {videos.length > 1 && (
          <div className="video-indicators">
            {videos.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentVideoIndex ? 'active' : ''}`}
                onClick={() => setCurrentVideoIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-logo">VideoApp</div>
          <div className="header-actions">
            {user ? (
              <>
                <div className="user-info-header">
                  <img 
                    src={user.avatarUrl || '/default-avatar.png'} 
                    alt={user.username}
                    className="user-avatar-small"
                  />
                  <span className="username-header">@{user.username}</span>
                </div>
                
                <button 
                  className="header-btn"
                  onClick={() => setShowSettings(!showSettings)}
                  title="설정"
                >
                  <SettingsIcon />
                </button>

                {showSettings && (
                  <div className="settings-dropdown">
                    <button onClick={() => setActiveTab('profile')}>
                      <UserIcon />
                      프로필
                    </button>
                    <button onClick={handleLogout}>
                      <LogOutIcon />
                      로그아웃
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button 
                className="header-btn login-btn"
                onClick={() => setShowAuthModal(true)}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {renderMainContent()}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <HomeIcon />
          <span>홈</span>
        </button>
        
        <button 
          className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <SearchIcon />
          <span>검색</span>
        </button>
        
        {user && (
          <button 
            className="nav-btn upload-btn"
            onClick={() => setShowUploadModal(true)}
          >
            <PlusIcon />
          </button>
        )}
        
        {user && (
          <button 
            className={`nav-btn ${activeTab === 'follow' ? 'active' : ''}`}
            onClick={() => setActiveTab('follow')}
          >
            <HeartIcon />
            <span>팔로우</span>
          </button>
        )}
        
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => user ? setActiveTab('profile') : setShowAuthModal(true)}
        >
          <UserIcon />
          <span>프로필</span>
        </button>
      </nav>

      {/* 모달들 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
        error={authError}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadSuccess}
        serverUrl={SERVER_URL}
        token={token}
      />

      <CommentModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        video={activeVideoForComments}
        serverUrl={SERVER_URL}
        token={token}
        user={user}
        onLoginRequired={() => setShowAuthModal(true)}
      />
    </div>
  );
};

export default App;