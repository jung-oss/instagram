// components/CommentsModal.js - 개선된 댓글 모달
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, HeartIcon, MoreIcon, SendIcon } from '../icons/Icons';
import './CommentSection.css';

const CommentsModal = ({ 
  isOpen, 
  onClose, 
  video, 
  serverUrl, 
  token, 
  user, 
  onLoginRequired 
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [likingComments, setLikingComments] = useState(new Set());
  
  const inputRef = useRef(null);
  const commentsListRef = useRef(null);

  // 댓글 로드
  const loadComments = async () => {
    if (!video?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${serverUrl}/api/videos/${video.id}/comments`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '댓글을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 로드 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    if (!user) {
      onLoginRequired();
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${serverUrl}/api/videos/${video.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentCommentId: replyTo?.id || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const comment = {
          ...data.comment,
          user_id: user.id,
          username: user.username,
          full_name: user.fullName,
          avatar_url: user.avatarUrl,
          likes_count: 0,
          replies_count: 0,
          is_liked_by_user: false
        };
        
        // 새 댓글을 목록에 추가
        if (replyTo) {
          // 대댓글인 경우
          setComments(prev => prev.map(c => 
            c.id === replyTo.id 
              ? { ...c, replies_count: (c.replies_count || 0) + 1 }
              : c
          ));
          // 실제로는 대댓글 목록을 별도로 관리해야 함
        } else {
          // 일반 댓글인 경우
          setComments(prev => [comment, ...prev]);
        }
        
        setNewComment('');
        setReplyTo(null);
        
        // 댓글 목록을 맨 위로 스크롤
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = 0;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 좋아요 토글
  const toggleCommentLike = async (commentId) => {
    if (!user) {
      onLoginRequired();
      return;
    }
    
    if (likingComments.has(commentId)) return;
    
    setLikingComments(prev => new Set([...prev, commentId]));
    
    try {
      const response = await fetch(`${serverUrl}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked_by_user: data.liked,
                likes_count: data.likesCount
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  // 답글 달기
  const handleReply = (comment) => {
    if (!user) {
      onLoginRequired();
      return;
    }
    
    setReplyTo(comment);
    setNewComment(`@${comment.username} `);
    inputRef.current?.focus();
  };

  // 답글 취소
  const cancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  // 댓글 확장/축소
  const toggleExpandComment = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // 시간 포맷팅
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
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

  // 모달이 열릴 때 댓글 로드
  useEffect(() => {
    if (isOpen && video?.id) {
      loadComments();
    }
  }, [isOpen, video?.id]);

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (replyTo) {
        cancelReply();
      } else {
        onClose();
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  if (!isOpen || !video) return null;

  return (
    <div className="comments-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="comments-modal">
        {/* 헤더 */}
        <div className="comments-header">
          <h3 className="comments-title">
            댓글 {comments.length}개
          </h3>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="댓글 창 닫기"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        {/* 댓글 목록 */}
        <div className="comments-list" ref={commentsListRef}>
          {loading ? (
            <div className="comments-loading">
              <div className="loading-spinner" />
              <p>댓글을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="comments-error">
              <p>{error}</p>
              <button onClick={loadComments}>다시 시도</button>
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <div className="empty-icon">💬</div>
              <h4>첫 번째 댓글을 남겨보세요!</h4>
              <p>이 비디오에 대한 생각을 공유해주세요.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <img 
                  src={comment.avatar_url || '/default-avatar.png'} 
                  alt={comment.username}
                  className="comment-avatar"
                />
                
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-username">@{comment.username}</span>
                    <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  
                  <div className={`comment-text ${expandedComments.has(comment.id) ? 'expanded' : ''}`}>
                    {comment.content}
                  </div>
                  
                  {comment.content.length > 100 && (
                    <button 
                      className="expand-btn"
                      onClick={() => toggleExpandComment(comment.id)}
                    >
                      {expandedComments.has(comment.id) ? '접기' : '더보기'}
                    </button>
                  )}
                  
                  <div className="comment-actions">
                    <button 
                      className={`comment-action-btn like-btn ${comment.is_liked_by_user ? 'liked' : ''} ${likingComments.has(comment.id) ? 'loading' : ''}`}
                      onClick={() => toggleCommentLike(comment.id)}
                      disabled={likingComments.has(comment.id)}
                    >
                      <HeartIcon size={14} filled={comment.is_liked_by_user} />
                      {comment.likes_count > 0 && (
                        <span>{formatNumber(comment.likes_count)}</span>
                      )}
                    </button>
                    
                    <button 
                      className="comment-action-btn reply-btn"
                      onClick={() => handleReply(comment)}
                    >
                      답글
                    </button>
                    
                    {comment.replies_count > 0 && (
                      <button className="replies-btn">
                        답글 {comment.replies_count}개 보기
                      </button>
                    )}
                    
                    <button className="comment-action-btn more-btn">
                      <MoreIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 댓글 입력 */}
        <div className="comment-input-section">
          {replyTo && (
            <div className="reply-indicator">
              <span>@{replyTo.username}님에게 답글</span>
              <button 
                className="cancel-reply-btn"
                onClick={cancelReply}
                aria-label="답글 취소"
              >
                <XIcon size={16} />
              </button>
            </div>
          )}
          
          {error && (
            <div className="input-error">
              {error}
            </div>
          )}
          
          <div className="input-container">
            {user ? (
              <>
                <img 
                  src={user.avatarUrl || '/default-avatar.png'} 
                  alt={user.username}
                  className="input-avatar"
                />
                
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef}
                    className="comment-input"
                    placeholder={replyTo ? `@${replyTo.username}님에게 답글...` : "댓글을 입력하세요..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitting}
                    rows={1}
                    style={{
                      resize: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                      overflow: newComment.length > 50 ? 'auto' : 'hidden'
                    }}
                  />
                  
                  <button 
                    className={`submit-btn ${!newComment.trim() || submitting ? 'disabled' : ''}`}
                    onClick={submitComment}
                    disabled={!newComment.trim() || submitting}
                    aria-label="댓글 게시"
                  >
                    {submitting ? (
                      <div className="btn-spinner" />
                    ) : (
                      <SendIcon size={20} />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="login-prompt">
                <p>댓글을 작성하려면 로그인이 필요합니다.</p>
                <button 
                  className="login-btn"
                  onClick={onLoginRequired}
                >
                  로그인
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// SendIcon 컴포넌트 (Icons.js에 추가하거나 여기에 정의)
const SendIcon = ({ size = 24, ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
  </svg>
);

export default CommentsModal;