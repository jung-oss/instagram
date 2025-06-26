import { useState, useEffect } from 'react';

export const useAuth = (SERVER_URL) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // API 호출 헬퍼 함수
  const apiCall = async (url, options = {}) => {
    try {
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${SERVER_URL}${url}`, config);
      
      if (response.status === 401) {
        handleTokenExpired();
        throw new Error('인증이 만료되었습니다.');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('API 호출 오류:', error);
      throw error;
    }
  };

  // 토큰 만료 처리
  const handleTokenExpired = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
  };

  // 토큰 검증
  const verifyToken = async (tokenToVerify) => {
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
        setError('');
      } else {
        handleTokenExpired();
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      handleTokenExpired();
    }
  };

  // 로그인 처리
  const handleLogin = async (loginData) => {
    if (!loginData.username || !loginData.password) {
      setError('사용자명과 비밀번호를 모두 입력해주세요.');
      return false;
    }

    try {
      setAuthLoading(true);
      setError('');
      
      const data = await apiCall('/api/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      return true;
      
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (registerData) => {
    if (!registerData.username || !registerData.password) {
      setError('사용자명과 비밀번호를 모두 입력해주세요.');
      return false;
    }

    if (registerData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }

    try {
      setAuthLoading(true);
      setError('');
      
      await apiCall('/api/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });
      
      setError('✅ 회원가입 성공! 로그인해주세요.');
      return true;
      
    } catch (error) {
      setError(error.message);
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
    setError('');
  };

  // 초기화 - 토큰 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
  }, []);

  return {
    user,
    token,
    authLoading,
    error,
    setError,
    handleLogin,
    handleRegister,
    handleLogout,
    apiCall,
    isAuthenticated: !!user && !!token
  };
}; 