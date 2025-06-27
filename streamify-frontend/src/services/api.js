// src/services/api.js - API 기본 설정
class ApiService {
    constructor(baseURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001') {
      this.baseURL = baseURL;
      this.token = localStorage.getItem('token');
    }
  
    // 토큰 설정
    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  
    // 기본 헤더 생성
    getHeaders(contentType = 'application/json') {
      const headers = {
        'Content-Type': contentType
      };
  
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
  
      return headers;
    }
  
    // GET 요청
    async get(endpoint, options = {}) {
      return this.request('GET', endpoint, null, options);
    }
  
    // POST 요청
    async post(endpoint, data = null, options = {}) {
      return this.request('POST', endpoint, data, options);
    }
  
    // PUT 요청
    async put(endpoint, data = null, options = {}) {
      return this.request('PUT', endpoint, data, options);
    }
  
    // DELETE 요청
    async delete(endpoint, options = {}) {
      return this.request('DELETE', endpoint, null, options);
    }
  
    // 기본 요청 메서드
    async request(method, endpoint, data = null, options = {}) {
      const { headers: customHeaders, ...otherOptions } = options;
      const isFormData = data instanceof FormData;
      
      const config = {
        method,
        headers: {
          ...this.getHeaders(isFormData ? undefined : 'application/json'),
          ...customHeaders
        },
        ...otherOptions
      };
  
      if (data && method !== 'GET') {
        config.body = isFormData ? data : JSON.stringify(data);
      }
  
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        // 응답이 JSON이 아닐 경우 처리
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
  
        if (!response.ok) {
          throw new ApiError(responseData.error || 'API 요청 실패', response.status, responseData);
        }
  
        return {
          data: responseData,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        
        // 네트워크 오류 등
        throw new ApiError('네트워크 오류가 발생했습니다.', 0, error);
      }
    }
  
    // 파일 업로드용 특별 메서드
    async uploadFile(endpoint, file, data = {}, onProgress = null) {
      const formData = new FormData();
      formData.append('file', file);
      
      // 추가 데이터 첨부
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
  
      const config = {
        method: 'POST',
        headers: {
          ...this.getHeaders(undefined) // Content-Type을 설정하지 않아 브라우저가 자동으로 설정하도록 함
        },
        body: formData
      };
  
      // 업로드 진행률 추적이 필요한 경우
      if (onProgress && typeof onProgress === 'function') {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              onProgress(percentComplete);
            }
          });
  
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const responseData = JSON.parse(xhr.responseText);
                resolve({
                  data: responseData,
                  status: xhr.status
                });
              } catch (error) {
                resolve({
                  data: xhr.responseText,
                  status: xhr.status
                });
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new ApiError(errorData.error || 'Upload failed', xhr.status, errorData));
              } catch (error) {
                reject(new ApiError('Upload failed', xhr.status, xhr.responseText));
              }
            }
          });
  
          xhr.addEventListener('error', () => {
            reject(new ApiError('네트워크 오류가 발생했습니다.', 0));
          });
  
          xhr.open('POST', `${this.baseURL}${endpoint}`);
          
          // Authorization 헤더 추가
          if (this.token) {
            xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
          }
          
          xhr.send(formData);
        });
      }
  
      return this.request('POST', endpoint, formData);
    }
  }
  
  // API 에러 클래스
  class ApiError extends Error {
    constructor(message, status, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  
    isNetworkError() {
      return this.status === 0;
    }
  
    isAuthError() {
      return this.status === 401 || this.status === 403;
    }
  
    isValidationError() {
      return this.status === 400;
    }
  
    isServerError() {
      return this.status >= 500;
    }
  }
  
  // 싱글톤 인스턴스 생성
  const apiService = new ApiService();
  
  export { apiService, ApiError };
  export default apiService;