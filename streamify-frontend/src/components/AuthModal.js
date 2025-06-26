import React, { useState, useEffect } from 'react';
import './AuthModal.css';

const AuthModal = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister, 
  initialMode = 'login',
  loading = false,
  error = ''
}) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '', className: '' });

  // 모드 변경 시 폼 초기화
  useEffect(() => {
    setMode(initialMode);
    clearForm();
  }, [initialMode]);

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
    
    // 비밀번호 강도 체크 (회원가입 모드에서만)
    if (field === 'password' && mode === 'register') {
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    if (mode === 'register') {
      if (formData.password.length < 6) {
        return;
      }
      if (!formData.terms) {
        return;
      }
      onRegister(formData);
    } else {
      onLogin(formData);
    }
  };

  // 모드 전환
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearForm();
  };

  // 비밀번호 표시/숨김
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h1 className="auth-title">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' ? '계정에 로그인하여 시작하세요' : '새 계정을 만들어 시작하세요'}
          </p>
        </div>

        {/* 소셜 로그인 (로그인 모드에서만) */}
        {mode === 'login' && (
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

          {mode === 'register' && (
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePassword}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            {mode === 'register' && (
              <div id="passwordStrength">
                <div className="strength-meter">
                  <div className={`strength-fill ${passwordStrength.className}`}></div>
                </div>
                <div className="strength-text">비밀번호 강도: {passwordStrength.text}</div>
              </div>
            )}
          </div>

          {mode === 'register' && (
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

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading && <span className="loading-spinner"></span>}
            {loading ? '처리중...' : (mode === 'login' ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="auth-switch">
          <p className="auth-switch-text">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </p>
          <button type="button" className="switch-btn" onClick={switchMode}>
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 