// src/services/authService.js - 인증 관련 API 서비스
import apiService, { ApiError } from './api';

class AuthService {
  // 로그인
  async login(credentials) {
    try {
      const { username, password } = credentials;
      
      if (!username || !password) {
        throw new ApiError('사용자명과 비밀번호를 입력해주세요.', 400);
      }

      const response = await apiService.post('/api/login', {
        username: username.trim(),
        password
      });

      const { token, user } = response.data;

      if (token) {
        apiService.setToken(token);
      }

      return {
        success: true,
        token,
        user,
        message: response.data.message
      };
    } catch (error) {
      console.error('로그인 오류:', error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // 회원가입
  async register(userData) {
    try {
      const { username, email, password, confirmPassword, fullName, terms } = userData;
      
      // 클라이언트 측 유효성 검사
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        throw new ApiError(validation.errors.join(' '), 400);
      }

      const response = await apiService.post('/api/register', {
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim()
      });

      const { token, user } = response.data;

      if (token) {
        apiService.setToken(token);
      }

      return {
        success: true,
        token,
        user,
        message: response.data.message
      };
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: '회원가입 중 오류가 발생했습니다.'
      };
    }
  }

  // 토큰 검증 및 사용자 정보 조회
  async verifyToken(token = null) {
    try {
      if (token) {
        apiService.setToken(token);
      }

      const response = await apiService.get('/api/profile');

      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      
      // 토큰이 유효하지 않은 경우 로컬스토리지에서 제거
      if (error instanceof ApiError && error.isAuthError()) {
        this.logout();
      }
      
      return {
        success: false,
        error: error.message || '인증에 실패했습니다.'
      };
    }
  }

  // 로그아웃
  logout() {
    apiService.setToken(null);
    return {
      success: true,
      message: '로그아웃되었습니다.'
    };
  }

  // 현재 로그인 상태 확인
  isLoggedIn() {
    return !!apiService.token;
  }

  // 현재 토큰 반환
  getCurrentToken() {
    return apiService.token;
  }

  // 회원가입 데이터 유효성 검사
  validateRegistrationData(userData) {
    const errors = [];
    const { username, email, password, confirmPassword, fullName, terms } = userData;

    // 사용자명 검증
    if (!username || username.trim().length < 3) {
      errors.push('사용자명은 3자 이상이어야 합니다.');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      errors.push('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다.');
    }

    // 이메일 검증
    if (!email || !this.isValidEmail(email.trim())) {
      errors.push('올바른 이메일 주소를 입력해주세요.');
    }

    // 비밀번호 검증
    if (!password || password.length < 8) {
      errors.push('비밀번호는 8자 이상이어야 합니다.');
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
      errors.push('비밀번호가 일치하지 않습니다.');
    }

    // 이름 검증
    if (!fullName || fullName.trim().length < 2) {
      errors.push('이름은 2자 이상이어야 합니다.');
    }

    // 이용약관 동의
    if (!terms) {
      errors.push('이용약관에 동의해주세요.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 로그인 데이터 유효성 검사
  validateLoginData(credentials) {
    const errors = [];
    const { username, password } = credentials;

    if (!username || username.trim().length === 0) {
      errors.push('사용자명을 입력해주세요.');
    }

    if (!password || password.length === 0) {
      errors.push('비밀번호를 입력해주세요.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 이메일 형식 검증
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 비밀번호 강도 검사
  checkPasswordStrength(password) {
    const requirements = [
      { regex: /.{8,}/, text: '8자 이상', key: 'length' },
      { regex: /[a-z]/, text: '소문자 포함', key: 'lowercase' },
      { regex: /[A-Z]/, text: '대문자 포함', key: 'uppercase' },
      { regex: /\d/, text: '숫자 포함', key: 'number' },
      { regex: /[!@#$%^&*(),.?":{}|<>]/, text: '특수문자 포함', key: 'special' }
    ];

    const metRequirements = requirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));

    const metCount = metRequirements.filter(req => req.met).length;
    let strength = 0;
    let strengthText = '';
    let strengthClass = '';

    if (metCount >= 4) {
      strength = 100;
      strengthText = '매우 강함';
      strengthClass = 'very-strong';
    } else if (metCount >= 3) {
      strength = 75;
      strengthText = '강함';
      strengthClass = 'strong';
    } else if (metCount >= 2) {
      strength = 50;
      strengthText = '보통';
      strengthClass = 'medium';
    } else if (metCount >= 1) {
      strength = 25;
      strengthText = '약함';
      strengthClass = 'weak';
    } else {
      strength = 0;
      strengthText = '매우 약함';
      strengthClass = 'very-weak';
    }

    return {
      strength,
      text: strengthText,
      className: strengthClass,
      requirements: metRequirements
    };
  }
}

// 싱글톤 인스턴스 생성
const authService = new AuthService();

export default authService;