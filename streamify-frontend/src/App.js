// App.js - 완전히 수정된 버전
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import UploadModal from './components/UploadModal';

// App.js 또는 index.js 최상단에 추가 (개발 환경에서만)
if (window.ResizeObserver) {
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
  const [activeVideo, setActiveVideo] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // 인증 관련 상태
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 업로드 및 기타 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

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
      } else {
        handleTokenExpired();
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      handleTokenExpired();
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
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '/api/videos/feed';
      
      if (activeTab === 'follow' && token) {
        endpoint = '/api/videos/feed?following=true';
      }

      const headers = {
          'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        }

      const response = await fetch(`${SERVER_URL}${endpoint}`, { headers });
        const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
        setError('');
      } else {
        setError(data.error || '비디오를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('비디오 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [SERVER_URL, activeTab, token]);

  // 로그인 처리
  const handleLogin = async (formData) => {
    const { username, password } = formData;
    
    if (!username.trim() || !password.trim()) {
      setAuthError('사용자명과 비밀번호를 모두 입력해주세요.');
      return false;
    }

    try {
      setAuthLoading(true);
      setAuthError('');
      
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
        setShowAuthModal(false);
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
  const handleRegister = async (formData) => {
    const { username, password, email } = formData;
    
    if (!username.trim() || !password.trim()) {
      setAuthError('사용자명과 비밀번호를 모두 입력해주세요.');
      return false;
    }

    if (password.length < 6) {
      setAuthError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }

    try {
      setAuthLoading(true);
      setAuthError('');
      
      const response = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(), 
          email: email.trim() || undefined 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAuthError('');
        setAuthMode('login');
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        return true;
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
  };
    
  // 팔로우 업데이트 처리
  const handleFollowUpdate = () => {
    loadVideos();
  };

  // 초기화
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
  }, [verifyToken]);

  // 탭 변경 시 비디오 로드
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // 인증 모달 컴포넌트 (인라인)
  const AuthModal = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      terms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ 
      strength: 0, text: '', className: '' 
    });

    // 폼 초기화
    const clearForm = () => {
      setFormData({
        username: '',
        email: '',
        password: '',
        terms: false
      });
      setShowPassword(false);
      setPasswordStrength({ strength: 0, text: '', className: '' });
    };

    // 입력 필드 변경 처리
    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      if (field === 'password' && authMode === 'register') {
        checkPasswordStrength(value);
      }
    };

    // 비밀번호 강도 체크
    const checkPasswordStrength = (password) => {
      let strength = 0;
      let text = '매우 약함';
      let className = 'strength-weak';

      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      if (strength >= 4) {
        text = '강함';
        className = 'strength-strong';
      } else if (strength >= 2) {
        text = '보통';
        className = 'strength-medium';
      }

      setPasswordStrength({ strength, text, className });
    };

    // 폼 제출 처리
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.username.trim() || !formData.password.trim()) {
        return;
      }

      if (authMode === 'register') {
        if (formData.password.length < 6) {
          return;
        }
        if (!formData.terms) {
          setAuthError('이용약관에 동의해주세요.');
          return;
        }
        await handleRegister(formData);
      } else {
        await handleLogin(formData);
      }
    };

    // 모드 전환
    const switchMode = () => {
      setAuthMode(authMode === 'login' ? 'register' : 'login');
      clearForm();
      setAuthError('');
    };

    if (!showAuthModal) return null;

    return (
      <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
        <div className="auth-container" onClick={(e) => e.stopPropagation()}>
          <div className="auth-header">
            <h1 className="auth-title">
              {authMode === 'login' ? '로그인' : '회원가입'}
            </h1>
            <p className="auth-subtitle">
              {authMode === 'login' 
                ? '계정에 로그인하여 시작하세요' 
                : '새 계정을 만들어 시작하세요'
              }
            </p>
          </div>

          {/* 소셜 로그인 (로그인 모드에서만) */}
          {authMode === 'login' && (
            <>
              <div className="social-login">
                <button className="social-btn" type="button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button className="social-btn" type="button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
              <div className="auth-divider">
                <span>또는</span>
            </div>
            </>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">사용자명</label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="사용자명을 입력하세요"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                autoComplete="username"
                spellCheck="false"
                autoFocus
              />
            </div>

            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              {authMode === 'register' && (
                <div id="passwordStrength">
                  <div className="strength-meter">
                    <div className={`strength-fill ${passwordStrength.className}`}></div>
            </div>
                  <div className="strength-text">비밀번호 강도: {passwordStrength.text}</div>
                  </div>
                )}
              </div>
              
            {authMode === 'register' && (
              <div className="checkbox-group">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.checked)}
                    required
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">이용약관 및 개인정보처리방침에 동의합니다</span>
                </label>
                  </div>
                )}

            {authError && (
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                {authError}
                  </div>
                )}

            <button
              type="submit"
              className={`auth-submit ${authLoading ? 'loading' : ''}`}
              disabled={authLoading}
            >
              {authLoading && <span className="loading-spinner"></span>}
              {authLoading ? '처리중...' : (authMode === 'login' ? '로그인' : '회원가입')}
            </button>
          </form>

          <div className="auth-switch">
            <p className="auth-switch-text">
              {authMode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            </p>
            <button type="button" className="switch-btn" onClick={switchMode}>
              {authMode === 'login' ? '회원가입' : '로그인'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 아이콘 컴포넌트들
  const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );

  const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );

  const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );

  // 메인 콘텐츠 렌더링
  const renderMainContent = () => {
    if (activeTab === 'search') {
      return (
        <div className="search-container">
          <h2>검색</h2>
          <p>검색 기능을 구현해주세요.</p>
        </div>
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
          <p>오류: {error}</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
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
              ? '팔로우한 사용자의 비디오가 없습니다.' 
              : '아직 업로드된 비디오가 없습니다.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="insta-feed">
        {videos.map((video) => (
          <div className="insta-card" key={video.id}>
            <div className="insta-card-header">
              <img src={video.uploaderAvatar} className="insta-avatar" alt={video.uploader} />
              <span className="insta-username">{video.uploader}</span>
              <span className="insta-time">{video.createdAt}</span>
            </div>
            <div className="insta-media">
              {video.filetype === 'video' ? (
                <video src={`${SERVER_URL}/videos/${video.filename}`} controls playsInline />
              ) : (
                <img src={`${SERVER_URL}/videos/${video.filename}`} alt={video.title} />
              )}
            </div>
            <div className="insta-card-actions">
              <button className="insta-like-btn">❤️</button>
              <button className="insta-comment-btn">💬</button>
            </div>
            <div className="insta-card-desc">
              <span className="insta-title">{video.title}</span>
              <span className="insta-hashtags">
                {Array.isArray(video.hashtags) && video.hashtags.map((tag, idx) => (
                  <span key={idx} className="hashtag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                ))}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 업로드 성공 처리
  const handleUploadSuccess = (uploadResponse) => {
    console.log('업로드 성공:', uploadResponse);
    // 비디오 피드 새로고침
    loadVideos();
    // 성공 메시지 표시
    const video = uploadResponse.video;
    const fileTypeText = video.filetype === 'video' ? '비디오' : '이미지';
    const privacyText = video.isPrivate ? '비공개' : '공개';
    alert(`${fileTypeText}가 성공적으로 업로드되었습니다!\n제목: ${video.title}\n설정: ${privacyText}`);
  };

  return (
    <div className="App">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">VideoApp</h1>
          
          <div className="header-actions">
            {user ? (
              <>
                      <button 
                  className="header-btn"
                  onClick={() => setShowUploadModal(true)}
                  title="비디오 업로드"
                >
                  <PlusIcon />
                      </button>
                      <button 
                  className="header-btn"
                  onClick={() => setShowSettings(true)}
                  title="설정"
                >
                  <SettingsIcon />
                      </button>
                <span className="user-greeting">
                  안녕하세요, {user.username}님!
                </span>
                <button 
                  className="header-btn"
                  onClick={handleLogout}
                  title="로그아웃"
                >
                  <UserIcon />
                </button>
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
            className={`nav-btn ${activeTab === 'follow' ? 'active' : ''}`}
            onClick={() => setActiveTab('follow')}
          >
            <HeartIcon />
            <span>팔로우</span>
          </button>
        )}
        
        {user && (
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
              <UserIcon />
          <span>프로필</span>
          </button>
        )}
      </nav>

      {/* 인증 모달 */}
      <AuthModal />

      {/* 업로드 모달 */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadSuccess}
        serverUrl={SERVER_URL}
      />
    </div>
  );
};

export default App;