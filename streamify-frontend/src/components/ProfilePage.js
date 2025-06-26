import React, { useEffect, useState } from 'react';
import './ProfilePage.css';

const ProfilePage = ({ user, token, serverUrl, currentUserId, onFollowUpdate }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // 팔로우 상태 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || currentUserId === user.id) return;
      
      try {
        const res = await fetch(`${serverUrl}/api/users/${user.id}/follow-status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setIsFollowing(data.isFollowing);
      } catch (e) {
        console.error('팔로우 상태 확인 실패:', e);
      }
    };
    
    if (user && token) checkFollowStatus();
  }, [user, token, serverUrl, currentUserId]);

  useEffect(() => {
    const fetchMyVideos = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${serverUrl}/api/profile/videos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setVideos(data.videos);
        else setError(data.error || '내 비디오를 불러올 수 없습니다.');
      } catch (e) {
        setError('내 비디오를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchMyVideos();
  }, [user, token, serverUrl]);

  // 팔로우/언팔로우 처리
  const handleFollowToggle = async () => {
    if (!token || currentUserId === user.id) return;
    
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${serverUrl}/api/users/${user.id}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setIsFollowing(!isFollowing);
        if (onFollowUpdate) {
          onFollowUpdate(user.id, !isFollowing);
        }
      }
    } catch (e) {
      console.error('팔로우 처리 실패:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  // 팔로워 목록 로드
  const loadFollowers = async () => {
    setFollowersLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/users/${user.id}/followers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok) setFollowers(data.followers);
    } catch (e) {
      console.error('팔로워 목록 로드 실패:', e);
    } finally {
      setFollowersLoading(false);
    }
  };

  // 팔로잉 목록 로드
  const loadFollowing = async () => {
    setFollowingLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/users/${user.id}/following`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok) setFollowing(data.following);
    } catch (e) {
      console.error('팔로잉 목록 로드 실패:', e);
    } finally {
      setFollowingLoading(false);
    }
  };

  // 팔로워/팔로잉 모달 토글
  const toggleFollowers = () => {
    if (!showFollowers) {
      loadFollowers();
    }
    setShowFollowers(!showFollowers);
    setShowFollowing(false);
  };

  const toggleFollowing = () => {
    if (!showFollowing) {
      loadFollowing();
    }
    setShowFollowing(!showFollowing);
    setShowFollowers(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img className="profile-avatar" src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} />
        <div className="profile-info">
          <div className="profile-username-row">
            <span className="profile-username">@{user.username}</span>
            {user.isVerified && <span className="profile-verified">✔️</span>}
          </div>
          <span className="profile-fullname">{user.fullName}</span>
          <span className="profile-bio">{user.bio}</span>
          
          {/* 팔로우 버튼 (다른 사용자 프로필일 때만 표시) */}
          {currentUserId && currentUserId !== user.id && (
            <button 
              className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? '처리중...' : isFollowing ? '언팔로우' : '팔로우'}
            </button>
          )}
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="stat-item" onClick={toggleFollowers}>
          <span className="stat-num">{user.followerCount}</span>
          <span className="stat-label">팔로워</span>
        </div>
        <div className="stat-item" onClick={toggleFollowing}>
          <span className="stat-num">{user.followingCount}</span>
          <span className="stat-label">팔로잉</span>
        </div>
        <div>
          <span className="stat-num">{user.videoCount}</span>
          <span className="stat-label">비디오</span>
        </div>
      </div>

      {/* 팔로워 모달 */}
      {showFollowers && (
        <div className="profile-modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>팔로워</h3>
              <button className="profile-modal-close" onClick={() => setShowFollowers(false)}>×</button>
            </div>
            <div className="profile-modal-content">
              {followersLoading ? (
                <div className="profile-loading">불러오는 중...</div>
              ) : followers.length === 0 ? (
                <div className="profile-empty">팔로워가 없습니다.</div>
              ) : (
                <div className="profile-user-list">
                  {followers.map(follower => (
                    <div key={follower.id} className="profile-user-item">
                      <img src={follower.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username}`} alt={follower.username} />
                      <div className="profile-user-info">
                        <span className="profile-user-username">@{follower.username}</span>
                        <span className="profile-user-name">{follower.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 팔로잉 모달 */}
      {showFollowing && (
        <div className="profile-modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>팔로잉</h3>
              <button className="profile-modal-close" onClick={() => setShowFollowing(false)}>×</button>
            </div>
            <div className="profile-modal-content">
              {followingLoading ? (
                <div className="profile-loading">불러오는 중...</div>
              ) : following.length === 0 ? (
                <div className="profile-empty">팔로잉한 사용자가 없습니다.</div>
              ) : (
                <div className="profile-user-list">
                  {following.map(followingUser => (
                    <div key={followingUser.id} className="profile-user-item">
                      <img src={followingUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${followingUser.username}`} alt={followingUser.username} />
                      <div className="profile-user-info">
                        <span className="profile-user-username">@{followingUser.username}</span>
                        <span className="profile-user-name">{followingUser.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="profile-videos-section">
        <h4>내 비디오</h4>
        {loading ? (
          <div className="profile-loading">불러오는 중...</div>
        ) : error ? (
          <div className="profile-error">{error}</div>
        ) : videos.length === 0 ? (
          <div className="profile-empty">아직 업로드한 비디오가 없습니다.</div>
        ) : (
          <div className="profile-videos-list">
            {videos.map(v => (
              <div className="profile-video-item" key={v.id}>
                <video src={`${serverUrl}/videos/${encodeURIComponent(v.filename)}`} controls poster="" className="profile-video-thumb" />
                <div className="profile-video-title">{v.title}</div>
                <div className="profile-video-meta">{v.is_public ? '공개' : '비공개'} · {v.views} 조회수</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 