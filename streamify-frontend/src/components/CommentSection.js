import React, { useState, useEffect } from 'react';
import './CommentSection.css';

const CommentSection = ({ videoId, isAuthenticated, token, serverUrl, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 댓글 불러오기
  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${serverUrl}/api/videos/${videoId}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments);
      else setError(data.error || '댓글을 불러올 수 없습니다.');
    } catch (e) {
      setError('댓글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [videoId]);

  // 댓글 작성
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${serverUrl}/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (res.ok) {
        setContent('');
        fetchComments();
      } else {
        setError(data.error || '댓글 작성 실패');
      }
    } catch (e) {
      setError('댓글 작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section-overlay">
      <div className="comment-section-modal">
        <div className="comment-header">
          <h3>댓글</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="comment-list">
          {loading ? (
            <div className="comment-loading">불러오는 중...</div>
          ) : comments.length === 0 ? (
            <div className="comment-empty">아직 댓글이 없습니다.</div>
          ) : (
            comments.map(c => (
              <div className="comment-item" key={c.id}>
                <img src={c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} alt={c.username} className="comment-avatar" />
                <div className="comment-content">
                  <span className="comment-username">{c.username}</span>
                  <span className="comment-text">{c.content}</span>
                  <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="comment-form-wrapper">
          {isAuthenticated ? (
            <form className="comment-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="댓글을 입력하세요..."
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={submitting}
                maxLength={200}
              />
              <button type="submit" disabled={submitting || !content.trim()}>
                {submitting ? '작성 중...' : '등록'}
              </button>
            </form>
          ) : (
            <div className="comment-login-required">댓글을 작성하려면 로그인하세요.</div>
          )}
          {error && <div className="comment-error">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default CommentSection; 