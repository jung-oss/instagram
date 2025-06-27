// components/AuthModal.js - 개선된 인증 모달
import React, { useState, useEffect } from 'react';
import { XIcon, EyeIcon, EyeOffIcon, CheckIcon, AlertIcon } from './icons/Icons';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLogin, onRegister, loading, error }) => {
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ 
    strength: 0, 
    text: '', 
    className: '',
    requirements: []
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      terms: false
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordStrength({ strength: 0, text: '', className: '', requirements: [] });
    setValidationErrors({});
    setIsFormValid(false);
  };

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // 입력 필드 변경 처리
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 실시간 유효성 검사
    validateField(field, value);
    
    // 비밀번호 강도 체크
    if (field === 'password' && authMode === 'register') {
      checkPasswordStrength(value);
    }
  };

  // 필드별 유효성 검사
  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'username':
        if (!value.trim()) {
          errors.username = '사용자명을 입력해주세요.';
        } else if (value.length < 3) {
          errors.username = '사용자명은 3자 이상이어야 합니다.';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.username = '영문, 숫자, 언더스코어만 사용 가능합니다.';
        } else {
          delete errors.username;
        }
        break;
        
      case 'email':
        if (authMode === 'register') {
          if (!value.trim()) {
            errors.email = '이메일을 입력해주세요.';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.email = '올바른 이메일 형식이 아닙니다.';
          } else {
            delete errors.email;
          }
        }
        break;
        
      case 'password':
        if (!value) {
          errors.password = '비밀번호를 입력해주세요.';
        } else if (authMode === 'register' && value.length < 8) {
          errors.password = '비밀번호는 8자 이상이어야 합니다.';
        } else {
          delete errors.password;
        }
        break;
        
      case 'confirmPassword':
        if (authMode === 'register') {
          if (!value) {
            errors.confirmPassword = '비밀번호를 다시 입력해주세요.';
          } else if (value !== formData.password) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;
        
      case 'fullName':
        if (authMode === 'register') {
          if (!value.trim()) {
            errors.fullName = '이름을 입력해주세요.';
          } else if (value.trim().length < 2) {
            errors.fullName = '이름은 2자 이상이어야 합니다.';
          } else {
            delete errors.fullName;
          }
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    
    // 폼 전체 유효성 확인
    checkFormValidity({ ...formData, [field]: value }, errors);
  };

  // 폼 전체 유효성 확인
  const checkFormValidity = (data = formData, errors = validationErrors) => {
    const hasErrors = Object.keys(errors).length > 0;
    let requiredFieldsFilled = false;
    
    if (authMode === 'login') {
      requiredFieldsFilled = data.username.trim() && data.password;
    } else {
      requiredFieldsFilled = data.username.trim() && 
                           data.email.trim() && 
                           data.password && 
                           data.confirmPassword &&
                           data.fullName.trim() &&
                           data.terms;
    }
    
    setIsFormValid(!hasErrors && requiredFieldsFilled);
  };

  // 비밀번호 강도 체크
  const checkPasswordStrength = (password) => {
    const requirements = [
      { test: password.length >= 8, text: '8자 이상' },
      { test: /[a-z]/.test(password), text: '소문자 포함' },
      { test: /[A-Z]/.test(password), text: '대문자 포함' },
      { test: /[0-9]/.test(password), text: '숫자 포함' },
      { test: /[^A-Za-z0-9]/.test(password), text: '특수문자 포함' }
    ];
    
    const passedRequirements = requirements.filter(req => req.test);
    const strength = passedRequirements.length;
    
    let text = '매우 약함';
    let className = 'strength-very-weak';
    
    if (strength >= 5) {
      text = '매우 강함';
      className = 'strength-very-strong';
    } else if (strength >= 4) {
      text = '강함';
      className = 'strength-strong';
    } else if (strength >= 3) {
      text = '보통';
      className = 'strength-medium';
    } else if (strength >= 2) {
      text = '약함';
      className = 'strength-weak';
    }

    setPasswordStrength({ strength, text, className, requirements });
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || loading) return;
    
    // 최종 유효성 검사
    Object.keys(formData).forEach(field => {
      if (authMode === 'login' && ['email', 'confirmPassword', 'fullName', 'terms'].includes(field)) {
        return;
      }
      validateField(field, formData[field]);
    });
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      let success = false;
      
      if (authMode === 'register') {
        success = await onRegister({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim()
        });
      } else {
        success = await onLogin({
          username: formData.username.trim(),
          password: formData.password
        });
      }
      
      if (success) {
        resetForm();
      }
    } catch (error) {
      console.error('인증 오류:', error);
    }
  };

  // 모드 전환
  const switchMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    resetForm();
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && isFormValid && !loading) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" onKeyDown={handleKeyDown}>
        <button className="close-btn" onClick={onClose} aria-label="닫기">
          <XIcon size={20} />
        </button>
        
        <div className="auth-header">
          <h2 className="auth-title">VideoApp</h2>
          <p className="auth-subtitle">
            {authMode === 'login' 
              ? '다시 만나서 반가워요!' 
              : '나만의 특별한 순간을 공유하세요'
            }
          </p>
        </div>
        
        {error && (
          <div className="auth-error">
            <AlertIcon size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* 사용자명 */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${validationErrors.username ? 'error' : ''}`}
              placeholder=" "
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={loading}
              autoComplete="username"
              aria-describedby={validationErrors.username ? 'username-error' : undefined}
            />
            <label className="form-label" htmlFor="username">사용자명</label>
            {validationErrors.username && (
              <span className="field-error" id="username-error">
                {validationErrors.username}
              </span>
            )}
          </div>
          
          {/* 이메일 (회원가입시에만) */}
          {authMode === 'register' && (
            <div className="form-group">
              <input
                type="email"
                className={`form-input ${validationErrors.email ? 'error' : ''}`}
                placeholder=" "
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                autoComplete="email"
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
              <label className="form-label" htmlFor="email">이메일</label>
              {validationErrors.email && (
                <span className="field-error" id="email-error">
                  {validationErrors.email}
                </span>
              )}
            </div>
          )}
          
          {/* 이름 (회원가입시에만) */}
          {authMode === 'register' && (
            <div className="form-group">
              <input
                type="text"
                className={`form-input ${validationErrors.fullName ? 'error' : ''}`}
                placeholder=" "
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={loading}
                autoComplete="name"
                aria-describedby={validationErrors.fullName ? 'fullName-error' : undefined}
              />
              <label className="form-label" htmlFor="fullName">이름</label>
              {validationErrors.fullName && (
                <span className="field-error" id="fullName-error">
                  {validationErrors.fullName}
                </span>
              )}
            </div>
          )}
          
          {/* 비밀번호 */}
          <div className="form-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder=" "
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                aria-describedby={validationErrors.password ? 'password-error' : undefined}
              />
              <label className="form-label" htmlFor="password">비밀번호</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {validationErrors.password && (
              <span className="field-error" id="password-error">
                {validationErrors.password}
              </span>
            )}
            
            {/* 비밀번호 강도 표시 (회원가입시에만) */}
            {authMode === 'register' && formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${passwordStrength.className}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <div className="strength-info">
                  <span className={`strength-text ${passwordStrength.className}`}>
                    {passwordStrength.text}
                  </span>
                  <div className="strength-requirements">
                    {passwordStrength.requirements.map((req, index) => (
                      <div key={index} className={`requirement ${req.test ? 'met' : 'unmet'}`}>
                        <CheckIcon size={12} />
                        <span>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 비밀번호 확인 (회원가입시에만) */}
          {authMode === 'register' && (
            <div className="form-group">
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder=" "
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <label className="form-label" htmlFor="confirmPassword">비밀번호 확인</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="field-error" id="confirmPassword-error">
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>
          )}
          
          {/* 이용약관 동의 (회원가입시에만) */}
          {authMode === 'register' && (
            <div className="form-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.checked)}
                  disabled={loading}
                  aria-describedby="terms-error"
                />
                <span className="checkmark">
                  <CheckIcon size={12} />
                </span>
                <span className="checkbox-text">
                  <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a> 및 
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>에 동의합니다
                </span>
              </label>
              {!formData.terms && Object.keys(validationErrors).length === 0 && formData.password && (
                <span className="field-error" id="terms-error">
                  이용약관에 동의해주세요.
                </span>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`auth-submit ${!isFormValid || loading ? 'disabled' : ''}`}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <div className="submit-spinner" />
                처리중...
              </>
            ) : (
              authMode === 'login' ? '로그인' : '회원가입'
            )}
          </button>
        </form>
        
        <div className="auth-switch">
          <span className="switch-text">
            {authMode === 'login' 
              ? '계정이 없으신가요?' 
              : '이미 계정이 있으신가요?'
            }
          </span>
          <button 
            type="button" 
            className="switch-btn" 
            onClick={switchMode}
            disabled={loading}
          >
            {authMode === 'login' ? '회원가입' : '로그인'}
          </button>
        </div>
        
        <div className="auth-footer">
          <p>안전하고 즐거운 VideoApp을 만들어가요! 🎉</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;