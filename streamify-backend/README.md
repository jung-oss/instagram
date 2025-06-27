# Streamify Backend

비디오 공유 플랫폼의 백엔드 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정
```bash
npm run setup
```

### 3. PostgreSQL 설정
1. PostgreSQL이 설치되어 있는지 확인
2. `videoapp` 데이터베이스 생성:
   ```sql
   CREATE DATABASE videoapp;
   ```
3. `.env` 파일에서 `DB_PASSWORD`를 실제 PostgreSQL 비밀번호로 변경

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📁 프로젝트 구조

```
streamify-backend/
├── server.js          # 메인 서버 파일
├── setup-env.js       # 환경 설정 스크립트
├── videos/            # 업로드된 비디오 파일 저장소
├── package.json       # 프로젝트 의존성
└── README.md          # 프로젝트 문서
```

## 🔧 환경 변수

`.env` 파일에서 다음 변수들을 설정할 수 있습니다:

- `DB_USER`: PostgreSQL 사용자명 (기본값: postgres)
- `DB_PASSWORD`: PostgreSQL 비밀번호
- `DB_HOST`: 데이터베이스 호스트 (기본값: localhost)
- `DB_NAME`: 데이터베이스 이름 (기본값: videoapp)
- `DB_PORT`: 데이터베이스 포트 (기본값: 5432)
- `JWT_SECRET`: JWT 토큰 시크릿 키
- `PORT`: 서버 포트 (기본값: 3001)
- `NODE_ENV`: 실행 환경 (development/production)

## 📡 API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인
- `GET /api/profile` - 프로필 조회

### 비디오
- `GET /api/videos/feed` - 비디오 피드 조회
- `POST /api/videos/upload` - 비디오 업로드
- `POST /api/videos/:id/like` - 비디오 좋아요

### 댓글
- `GET /api/videos/:id/comments` - 댓글 조회
- `POST /api/videos/:id/comments` - 댓글 작성
- `POST /api/comments/:id/like` - 댓글 좋아요

### 팔로우
- `POST /api/users/:id/follow` - 사용자 팔로우/언팔로우

### 상태
- `GET /api/health` - 서버 상태 확인
- `GET /api/status` - 상세 서버 정보

## 🛠️ 문제 해결

### 데이터베이스 연결 오류
1. PostgreSQL이 실행 중인지 확인
2. 데이터베이스가 존재하는지 확인
3. 사용자 권한이 올바른지 확인
4. `.env` 파일의 비밀번호가 정확한지 확인

### 파일 업로드 오류
1. `videos` 폴더가 존재하는지 확인
2. 파일 크기가 100MB 이하인지 확인
3. 지원하는 파일 형식인지 확인

## 📝 지원하는 파일 형식

### 비디오
- MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV, MPEG

### 이미지
- JPEG, JPG, PNG, GIF, WebP, BMP, TIFF, SVG

## 🔒 보안

- JWT 토큰 기반 인증
- 비밀번호 해시화 (bcrypt)
- CORS 설정
- 파일 업로드 제한
- SQL 인젝션 방지

## 📄 라이선스

MIT License 