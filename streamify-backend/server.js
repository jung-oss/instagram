const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// 환경 변수 로드
require('dotenv').config();

const app = express();

// 환경 변수
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// PostgreSQL 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'streaming_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'streaming_app',
  password: process.env.DB_PASSWORD || 'jung1234',
  port: process.env.DB_PORT || 5432,
});

// 데이터베이스 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

// CORS 설정
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.45.199:3000',
    'http://172.22.80.1:3000',
    'http://192.168.208.1:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  credentials: true
};

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(express.json({ limit: '3000mb' }));
app.use(express.urlencoded({ extended: true, limit: '3000mb' }));
app.use(express.static('public'));
app.options('*', cors(corsOptions));

// 한글 파일명을 안전한 영문으로 변환하는 함수
function sanitizeFilename(originalName) {
  try {
    let decodedName = originalName;
    
    if (originalName.includes('ì') || originalName.includes('ë') || originalName.includes('í')) {
      try {
        const buffer = Buffer.from(originalName, 'latin1');
        decodedName = buffer.toString('utf8');
      } catch (e) {
        console.log('인코딩 복구 실패, 원본 사용:', originalName);
        decodedName = originalName;
      }
    }
    
    const ext = path.extname(decodedName).toLowerCase();
    const nameWithoutExt = path.basename(decodedName, ext);
    
    let safeName = nameWithoutExt
      .replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    
    if (!safeName || safeName.length < 2) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      safeName = `video-${timestamp}-${random}`;
    }
    
    const finalName = safeName + ext;
    console.log('📝 최종 파일명:', finalName);
    
    return finalName;
    
  } catch (error) {
    console.error('파일명 변환 오류:', error);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName).toLowerCase() || '.mp4';
    return `video-${timestamp}-${random}${ext}`;
  }
}

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './videos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log('📁 업로드 파일 정보:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, sanitizedName);
  }
});

// 지원하는 파일 형식 정의
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
  'video/wmv', 'video/flv', 'video/mkv', 'video/x-matroska', 'video/x-msvideo',
  'video/x-flv', 'video/x-ms-wmv', 'video/x-m4v', 'video/3gpp', 'video/3gpp2',
  'video/quicktime', 'video/mpeg', 'video/x-mpeg'
];

const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/bmp', 'image/tiff', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'
];

const SUPPORTED_FORMATS = [...SUPPORTED_VIDEO_FORMATS, ...SUPPORTED_IMAGE_FORMATS];

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('🔍 파일 필터 검사:', file.mimetype);
    if (SUPPORTED_FORMATS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. 비디오 또는 이미지 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB
  }
});

// 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다.' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('토큰 검증 실패:', err.message);
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
}

// 선택적 인증 미들웨어
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

// 시간 계산 함수
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
}

// 비디오 메타데이터 분석 함수
function getVideoMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const metadata = {
      size: stats.size,
      duration: null,
      width: null,
      height: null,
      aspectRatio: null,
      bitrate: null,
      fps: null,
      format: ext.substring(1),
      created: stats.birthtime,
      modified: stats.mtime
    };
    
    switch (ext) {
      case '.mp4':
      case '.mov':
        metadata.width = 1080;
        metadata.height = 1920;
        metadata.aspectRatio = '9:16';
        break;
      case '.webm':
        metadata.width = 1280;
        metadata.height = 720;
        metadata.aspectRatio = '16:9';
        break;
      default:
        metadata.width = 1080;
        metadata.height = 1920;
        metadata.aspectRatio = '9:16';
    }
    
    return metadata;
  } catch (error) {
    console.error('메타데이터 분석 오류:', error);
    return null;
  }
}

// 데이터베이스 초기화
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // 사용자 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        full_name VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(500),
        follower_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 비디오 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path VARCHAR(500),
        file_size INTEGER,
        duration INTEGER,
        width INTEGER,
        height INTEGER,
        aspect_ratio VARCHAR(10),
        thumbnail_url VARCHAR(500),
        uploader_id INTEGER REFERENCES users(id),
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        hashtags TEXT[],
        location VARCHAR(255),
        is_public BOOLEAN DEFAULT true,
        processing_status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        filetype VARCHAR(10)
      )
    `);

    // 좋아요 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id)
      )
    `);

    // 댓글 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id INTEGER REFERENCES comments(id),
        likes_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 팔로우 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    console.log('✅ 데이터베이스 테이블 초기화 완료');
    
    // 더미 사용자 생성
    await createDummyUsers(client);
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 더미 사용자 생성 함수
async function createDummyUsers(client) {
  const dummyUsers = [
    { username: 'sunset_hunter', fullName: 'Sarah Kim', bio: '🌅 Chasing golden hours & magical moments' },
    { username: 'city_nights', fullName: 'Alex Chen', bio: '🌃 Urban explorer | Night photographer' },
    { username: 'coffee_artisan', fullName: 'Emma Wilson', bio: '☕ Barista & Latte artist' },
    { username: 'wave_whisperer', fullName: 'Ocean Soul', bio: '🌊 Ocean lover | Meditation teacher' },
    { username: 'foodie_wanderer', fullName: 'Miguel Rodriguez', bio: '🌮 Street food explorer' }
  ];

  for (const user of dummyUsers) {
    try {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await client.query(`
        INSERT INTO users (username, password, full_name, bio, avatar_url, video_count, follower_count, following_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (username) DO NOTHING
      `, [
        user.username,
        hashedPassword,
        user.fullName,
        user.bio,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        Math.floor(Math.random() * 20) + 5,
        Math.floor(Math.random() * 1000) + 100,
        Math.floor(Math.random() * 500) + 50
      ]);
    } catch (error) {
      console.log(`더미 사용자 생성 건너뛰기: ${user.username}`);
    }
  }
}

// === API 라우트 ===

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '🎬 StreamiFy Server',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      videos: '/api/videos/feed (GET)',
      upload: '/api/videos/upload (POST)',
      auth: '/api/login, /api/register',
      status: '/api/status (GET)'
    }
  });
});

// 회원가입
app.post('/api/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, password, email, fullName, bio } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호가 필요합니다.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '이미 사용 중인 사용자명 또는 이메일입니다.' });
    }
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await client.query(
      `INSERT INTO users (username, password, email, full_name, bio, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, full_name`,
      [
        username, 
        email, 
        hashedPassword, 
        email, 
        fullName || username,
        bio || '',
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      ]
    );
    
    const newUser = result.rows[0];
    console.log(`👤 새 사용자 등록: ${username} (ID: ${newUser.id})`);
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.full_name
      }
    });
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호가 필요합니다.' });
    }
    
    const result = await client.query(
      `SELECT id, username, password, full_name, bio, avatar_url, 
              follower_count, following_count, video_count, is_verified
       FROM users WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    const user = result.rows[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`🔑 사용자 로그인: ${username} (ID: ${user.id})`);
    
    res.json({
      token,
      message: '로그인 성공!',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        videoCount: user.video_count,
        isVerified: user.is_verified
      }
    });
    
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 프로필 조회
app.get('/api/profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT id, username, full_name, bio, avatar_url, email,
              follower_count, following_count, video_count, is_verified, is_private
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        email: user.email,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        videoCount: user.video_count,
        isVerified: user.is_verified,
        isPrivate: user.is_private
      }
    });
    
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '프로필을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 내 비디오 목록 조회
app.get('/api/profile/videos', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const result = await client.query(
      `SELECT id, title, description, filename, file_size, duration, width, height, aspect_ratio, views, likes, comments_count, shares, hashtags, location, created_at, is_public
       FROM videos
       WHERE uploader_id = $1 AND filename IS NOT NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ videos: result.rows });
  } catch (error) {
    console.error('내 비디오 목록 조회 오류:', error);
    res.status(500).json({ error: '내 비디오 목록을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 비디오 목록 API (기본)
app.get('/api/videos', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user?.userId;
    
    let query = `
      SELECT 
        v.id, v.title, v.description, v.filename, v.original_name, v.file_size,
        v.duration, v.width, v.height, v.aspect_ratio, v.views, v.likes, 
        v.comments_count, v.shares, v.hashtags, v.location, v.created_at, v.is_public,
        u.username as uploader, u.full_name as uploader_full_name, 
        u.avatar_url as uploader_avatar, u.follower_count as uploader_followers,
        u.is_verified as uploader_verified,
        v.filetype
    `;
    
    let params = [limit, offset];
    
    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = $3) as is_liked_by_user,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $3 AND f.following_id = v.uploader_id) as is_following_uploader
      `;
      params.push(userId);
    } else {
      query += `,
        false as is_liked_by_user,
        false as is_following_uploader
      `;
    }
    
    // 공개 설정 필터링
    let privacyFilter = 'v.is_public = true';
    if (userId) {
      // 로그인한 사용자는 자신의 비디오(공개/비공개 모두)와 다른 사용자의 공개 비디오를 볼 수 있음
      privacyFilter = '(v.is_public = true OR v.uploader_id = $' + (params.length + 1) + ')';
      params.push(userId);
    }
    
    query += `
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      WHERE ${privacyFilter} AND v.filename IS NOT NULL
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await client.query(query, params);
    
    const videos = await Promise.all(result.rows.map(async (video) => {
      // 파일 존재 확인
      const filePath = path.join(__dirname, 'videos', video.filename);
      const fileExists = fs.existsSync(filePath);
      
      if (!fileExists) {
        return null;
      }

      return {
        id: video.id,
        title: video.title || video.original_name,
        description: video.description || '',
        url: `/videos/${encodeURIComponent(video.filename)}`,
        filename: video.filename,
        uploader: video.uploader || 'Unknown',
        uploaderFullName: video.uploader_full_name,
        uploaderAvatar: video.uploader_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.uploader}`,
        uploaderFollowers: video.uploader_followers || 0,
        uploaderVerified: video.uploader_verified || false,
        views: video.views || 0,
        likes: video.likes || 0,
        comments: video.comments_count || 0,
        shares: video.shares || 0,
        aspectRatio: video.aspect_ratio || '9:16',
        hashtags: video.hashtags || [],
        location: video.location,
        createdAt: getTimeAgo(video.created_at),
        isLiked: video.is_liked_by_user || false,
        isFollowingUploader: video.is_following_uploader || false,
        isPublic: video.is_public,
        commentsList: [],
        size: video.file_size,
        duration: video.duration,
        width: video.width,
        height: video.height,
        filetype: video.filetype
      };
    }));

    // null 값 제거 (존재하지 않는 파일)
    const validVideos = videos.filter(v => v !== null);
    
    console.log(`📹 비디오 목록 ${validVideos.length}개 조회됨 (페이지 ${page})`);
    
    res.json({
      videos: validVideos,
      pagination: {
        page,
        limit,
        hasMore: validVideos.length === limit,
        total: validVideos.length
      }
    });
    
  } catch (error) {
    console.error('비디오 목록 조회 오류:', error);
    res.status(500).json({ error: '비디오 목록을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 비디오 피드 API
app.get('/api/videos/feed', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user?.userId;
    
    let query = `
      SELECT 
        v.id, v.title, v.description, v.filename, v.original_name, v.file_size,
        v.duration, v.width, v.height, v.aspect_ratio, v.views, v.likes, 
        v.comments_count, v.shares, v.hashtags, v.location, v.created_at, v.is_public,
        u.username as uploader, u.full_name as uploader_full_name, 
        u.avatar_url as uploader_avatar, u.follower_count as uploader_followers,
        u.is_verified as uploader_verified,
        v.filetype
    `;
    
    let params = [limit, offset];
    
    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = $3) as is_liked_by_user,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $3 AND f.following_id = v.uploader_id) as is_following_uploader
      `;
      params.push(userId);
    } else {
      query += `,
        false as is_liked_by_user,
        false as is_following_uploader
      `;
    }
    
    // 공개 설정 필터링
    let privacyFilter = 'v.is_public = true';
    if (userId) {
      // 로그인한 사용자는 자신의 비디오(공개/비공개 모두)와 다른 사용자의 공개 비디오를 볼 수 있음
      privacyFilter = '(v.is_public = true OR v.uploader_id = $' + (params.length + 1) + ')';
      params.push(userId);
    }
    
    query += `
      FROM videos v
      LEFT JOIN users u ON v.uploader_id = u.id
      WHERE ${privacyFilter} AND v.filename IS NOT NULL
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await client.query(query, params);
    
    const videos = await Promise.all(result.rows.map(async (video) => {
      // 파일 존재 확인
      const filePath = path.join(__dirname, 'videos', video.filename);
      const fileExists = fs.existsSync(filePath);
      
      if (!fileExists) {
        return null;
      }

      return {
        id: video.id,
        title: video.title || video.original_name,
        description: video.description || '',
        url: `/videos/${encodeURIComponent(video.filename)}`,
        filename: video.filename,
        uploader: video.uploader || 'Unknown',
        uploaderFullName: video.uploader_full_name,
        uploaderAvatar: video.uploader_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.uploader}`,
        uploaderFollowers: video.uploader_followers || 0,
        uploaderVerified: video.uploader_verified || false,
        views: video.views || 0,
        likes: video.likes || 0,
        comments: video.comments_count || 0,
        shares: video.shares || 0,
        aspectRatio: video.aspect_ratio || '9:16',
        hashtags: video.hashtags || [],
        location: video.location,
        createdAt: getTimeAgo(video.created_at),
        isLiked: video.is_liked_by_user || false,
        isFollowingUploader: video.is_following_uploader || false,
        isPublic: video.is_public,
        commentsList: [],
        size: video.file_size,
        duration: video.duration,
        width: video.width,
        height: video.height,
        filetype: video.filetype
      };
    }));

    // null 값 제거 (존재하지 않는 파일)
    const validVideos = videos.filter(v => v !== null);
    
    console.log(`📹 피드 비디오 ${validVideos.length}개 조회됨 (페이지 ${page})`);
    
    res.json({
      videos: validVideos,
      pagination: {
        page,
        limit,
        hasMore: validVideos.length === limit,
        total: validVideos.length
      }
    });
    
  } catch (error) {
    console.error('비디오 피드 조회 오류:', error);
    res.status(500).json({ error: '비디오 피드를 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 비디오 업로드
app.post('/api/videos/upload', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('업로드 파일 정보:', req.file);
  
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
    }
    
    const { originalname, filename, size } = req.file;
    const { title, description, hashtags, location, isPrivate } = req.body;
    
    // 공개 설정 처리 (기본값: 공개)
    const isPublic = isPrivate === 'true' ? false : true;
    
    // 파일이 실제로 저장되었는지 확인
    const filePath = path.join(__dirname, 'videos', filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('파일 저장에 실패했습니다.');
    }

    // 비디오 메타데이터 분석
    const metadata = getVideoMetadata(filePath);
    
    // 해시태그 처리
    let hashtagArray = [];
    if (hashtags) {
      try {
        hashtagArray = typeof hashtags === 'string' ? JSON.parse(hashtags) : hashtags;
      } catch (e) {
        hashtagArray = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    // 데이터베이스에 저장
    const filetype = SUPPORTED_VIDEO_FORMATS.includes(req.file.mimetype) ? 'video' : 'image';
    const result = await client.query(
      `INSERT INTO videos (
        title, description, filename, original_name, file_size, 
        uploader_id, file_path, duration, width, height, aspect_ratio, 
        hashtags, location, processing_status, is_public, filetype
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
       RETURNING id`,
      [
        title || originalname, 
        description || '', 
        filename, 
        originalname, 
        size, 
        req.user.userId, 
        filePath,
        metadata?.duration,
        metadata?.width,
        metadata?.height,
        metadata?.aspectRatio,
        hashtagArray,
        location,
        'completed',
        isPublic,
        filetype
      ]
    );
    
    // 사용자의 비디오 수 증가
    await client.query(
      'UPDATE users SET video_count = video_count + 1 WHERE id = $1',
      [req.user.userId]
    );
    
    console.log(`✅ 비디오 업로드 완료: ${title || originalname} (ID: ${result.rows[0].id}, 공개: ${isPublic})`);
    
    res.json({
      message: '업로드가 완료되었습니다.',
      video: {
        id: result.rows[0].id,
        title: title || originalname,
        filename: filename,
        url: `/videos/${encodeURIComponent(filename)}`,
        metadata: metadata,
        hashtags: hashtagArray,
        location: location,
        isPublic: isPublic,
        filetype: filetype
      }
    });
    
  } catch (error) {
    console.error('업로드 오류:', error);
    
    // 업로드 실패시 파일 삭제
    if (req.file && req.file.filename) {
      const filePath = path.join(__dirname, 'videos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('실패한 업로드 파일 삭제:', req.file.filename);
      }
    }
    
    res.status(500).json({ error: '업로드 중 오류가 발생했습니다: ' + error.message });
  } finally {
    client.release();
  }
});

// 좋아요 토글
app.post('/api/videos/:id/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: '유효하지 않은 비디오 ID입니다.' });
    }

    // 기존 좋아요 확인
    const existingLike = await client.query(
      'SELECT id FROM likes WHERE video_id = $1 AND user_id = $2',
      [videoId, userId]
    );

    if (existingLike.rows.length > 0) {
      // 좋아요 취소
      await client.query('DELETE FROM likes WHERE video_id = $1 AND user_id = $2', [videoId, userId]);
      await client.query('UPDATE videos SET likes = likes - 1 WHERE id = $1', [videoId]);
      
      res.json({ message: '좋아요를 취소했습니다.', isLiked: false });
    } else {
      // 좋아요 추가
      await client.query('INSERT INTO likes (video_id, user_id) VALUES ($1, $2)', [videoId, userId]);
      await client.query('UPDATE videos SET likes = likes + 1 WHERE id = $1', [videoId]);
      
      res.json({ message: '좋아요를 추가했습니다.', isLiked: true });
    }
    
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 비디오 서빙 라우트
app.get('/videos/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(__dirname, 'videos', filename);
    
    console.log('🎬 비디오 요청:', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ 파일 없음:', filename);
      return res.status(404).json({ error: '비디오 파일을 찾을 수 없습니다.' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    // MIME 타입 설정
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'video/mp4';
    
    switch (ext) {
      case '.mp4': contentType = 'video/mp4'; break;
      case '.webm': contentType = 'video/webm'; break;
      case '.avi': contentType = 'video/x-msvideo'; break;
      case '.mov': contentType = 'video/quicktime'; break;
      case '.mkv': contentType = 'video/x-matroska'; break;
      case '.m4v': contentType = 'video/x-m4v'; break;
      default: contentType = 'application/octet-stream';
    }
    
    // Range 요청 처리 (스트리밍)
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize || start > end) {
        return res.status(416).send('Requested range not satisfiable');
      }
      
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
      
      file.pipe(res);
      
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
    
  } catch (error) {
    console.error('비디오 서빙 오류:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '비디오 서빙 중 오류가 발생했습니다.' });
    }
  }
});

// 서버 상태 확인
app.get('/api/status', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM videos) as videos,
        (SELECT COUNT(*) FROM comments) as comments,
        (SELECT COUNT(*) FROM likes) as likes
    `);
    
    const stats = result.rows[0];
    const videosDir = path.join(__dirname, 'videos');
    const videoFiles = fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : [];
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      users: parseInt(stats.users),
      videos: parseInt(stats.videos),
      comments: parseInt(stats.comments),
      likes: parseInt(stats.likes),
      videoFiles: videoFiles.length,
      port: PORT,
      version: '1.0.0'
    });
    
  } catch (error) {
    console.error('상태 확인 오류:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  } finally {
    client.release();
  }
});

// 헬스체크
app.get('/api/health', (req, res) => {
  const videosDir = path.join(__dirname, 'videos');
  const videoFiles = fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : [];
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'running',
    videos_folder_exists: fs.existsSync(videosDir),
    video_files_count: videoFiles.length,
    sample_files: videoFiles.slice(0, 3),
    client_ip: req.ip,
    user_agent: req.headers['user-agent'],
    cors_origin: req.headers.origin,
    version: '1.0.0'
  });
});

// 비디오별 댓글 조회
app.get('/api/videos/:id/comments', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({ error: '유효하지 않은 비디오 ID입니다.' });
    }
    const result = await client.query(
      `SELECT c.id, c.content, c.created_at, c.parent_comment_id, c.likes_count, c.replies_count,
              u.id as user_id, u.username, u.full_name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.video_id = $1
       ORDER BY c.created_at ASC`,
      [videoId]
    );
    res.json({ comments: result.rows });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({ error: '댓글을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 비디오별 댓글 작성
app.post('/api/videos/:id/comments', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const videoId = parseInt(req.params.id);
    const { content, parentCommentId } = req.body;
    if (isNaN(videoId) || !content || content.trim().length === 0) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }
    const result = await client.query(
      `INSERT INTO comments (video_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, created_at, parent_comment_id`,
      [videoId, req.user.userId, content, parentCommentId || null]
    );
    // 댓글 수 증가
    await client.query('UPDATE videos SET comments_count = comments_count + 1 WHERE id = $1', [videoId]);
    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 팔로우 시스템 API

// 사용자 팔로우
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const targetUserId = parseInt(req.params.id);
    const followerId = req.user.userId;
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    if (targetUserId === followerId) {
      return res.status(400).json({ error: '자신을 팔로우할 수 없습니다.' });
    }
    
    // 이미 팔로우 중인지 확인
    const existingFollow = await client.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );
    
    if (existingFollow.rows.length > 0) {
      return res.status(400).json({ error: '이미 팔로우 중입니다.' });
    }
    
    // 팔로우 관계 생성
    await client.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, targetUserId]
    );
    
    // 팔로우/팔로잉 수 업데이트
    await client.query(
      'UPDATE users SET followers_count = followers_count + 1 WHERE id = $1',
      [targetUserId]
    );
    await client.query(
      'UPDATE users SET following_count = following_count + 1 WHERE id = $1',
      [followerId]
    );
    
    res.json({ message: '팔로우되었습니다.' });
    
  } catch (error) {
    console.error('팔로우 오류:', error);
    res.status(500).json({ error: '팔로우 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 사용자 언팔로우
app.delete('/api/users/:id/follow', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const targetUserId = parseInt(req.params.id);
    const followerId = req.user.userId;
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    // 팔로우 관계 삭제
    const result = await client.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({ error: '팔로우 관계가 존재하지 않습니다.' });
    }
    
    // 팔로우/팔로잉 수 업데이트
    await client.query(
      'UPDATE users SET followers_count = followers_count - 1 WHERE id = $1',
      [targetUserId]
    );
    await client.query(
      'UPDATE users SET following_count = following_count - 1 WHERE id = $1',
      [followerId]
    );
    
    res.json({ message: '언팔로우되었습니다.' });
    
  } catch (error) {
    console.error('언팔로우 오류:', error);
    res.status(500).json({ error: '언팔로우 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 팔로우 상태 확인
app.get('/api/users/:id/follow-status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const targetUserId = parseInt(req.params.id);
    const followerId = req.user.userId;
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    const result = await client.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, targetUserId]
    );
    
    res.json({ isFollowing: result.rows.length > 0 });
    
  } catch (error) {
    console.error('팔로우 상태 확인 오류:', error);
    res.status(500).json({ error: '팔로우 상태를 확인할 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 팔로워 목록 조회
app.get('/api/users/:id/followers', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    const result = await client.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
              f.created_at as followed_at,
              EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following_back
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $2
       ORDER BY f.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user?.userId || 0, userId, limit, offset]
    );
    
    const countResult = await client.query(
      'SELECT COUNT(*) FROM follows WHERE following_id = $1',
      [userId]
    );
    
    res.json({
      followers: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalFollowers: parseInt(countResult.rows[0].count),
        hasMore: offset + limit < countResult.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('팔로워 목록 조회 오류:', error);
    res.status(500).json({ error: '팔로워 목록을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 팔로잉 목록 조회
app.get('/api/users/:id/following', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }
    
    const result = await client.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
              f.created_at as followed_at,
              EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = $1) as is_following_back
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $2
       ORDER BY f.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user?.userId || 0, userId, limit, offset]
    );
    
    const countResult = await client.query(
      'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
      [userId]
    );
    
    res.json({
      following: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalFollowing: parseInt(countResult.rows[0].count),
        hasMore: offset + limit < countResult.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('팔로잉 목록 조회 오류:', error);
    res.status(500).json({ error: '팔로잉 목록을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 팔로우한 사용자들의 비디오 피드
app.get('/api/videos/following', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const result = await client.query(
      `SELECT v.*, u.username, u.full_name, u.avatar_url,
              EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as is_liked,
              (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
       FROM videos v
       JOIN users u ON v.user_id = u.id
       WHERE v.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       ) AND v.privacy = 'public'
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await client.query(
      `SELECT COUNT(*) FROM videos v
       WHERE v.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       ) AND v.privacy = 'public'`,
      [userId]
    );
    
    const videos = result.rows.map(video => ({
      ...video,
      created_at: getTimeAgo(video.created_at)
    }));
    
    res.json({
      videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalVideos: parseInt(countResult.rows[0].count),
        hasMore: offset + limit < countResult.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('팔로우 피드 조회 오류:', error);
    res.status(500).json({ error: '팔로우 피드를 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 검색 시스템 API

// 비디오 검색
app.get('/api/search/videos', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    let query, countQuery, params;
    
    if (type === 'hashtag') {
      // 해시태그 검색
      query = `
        SELECT v.*, u.username, u.full_name, u.avatar_url,
               EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as is_liked,
               (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
        FROM videos v
        JOIN users u ON v.user_id = u.id
        WHERE v.hashtags && ARRAY[$2]::text[] AND v.privacy = 'public'
        ORDER BY v.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      countQuery = `
        SELECT COUNT(*) FROM videos v
        WHERE v.hashtags && ARRAY[$1]::text[] AND v.privacy = 'public'
      `;
      params = [req.user?.userId || 0, q.trim(), limit, offset];
    } else {
      // 제목/설명 검색
      query = `
        SELECT v.*, u.username, u.full_name, u.avatar_url,
               EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1) as is_liked,
               (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
        FROM videos v
        JOIN users u ON v.user_id = u.id
        WHERE (v.title ILIKE $2 OR v.description ILIKE $2) AND v.privacy = 'public'
        ORDER BY v.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      countQuery = `
        SELECT COUNT(*) FROM videos v
        WHERE (v.title ILIKE $1 OR v.description ILIKE $1) AND v.privacy = 'public'
      `;
      params = [req.user?.userId || 0, searchTerm, limit, offset];
    }
    
    const [result, countResult] = await Promise.all([
      client.query(query, params),
      client.query(countQuery, type === 'hashtag' ? [q.trim()] : [searchTerm])
    ]);
    
    const videos = result.rows.map(video => ({
      ...video,
      created_at: getTimeAgo(video.created_at)
    }));
    
    res.json({
      videos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalVideos: parseInt(countResult.rows[0].count),
        hasMore: offset + limit < countResult.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('비디오 검색 오류:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 사용자 검색
app.get('/api/search/users', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    const result = await client.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio,
              u.follower_count, u.following_count, u.video_count,
              EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id) as is_following
       FROM users u
       WHERE (u.username ILIKE $2 OR u.full_name ILIKE $2 OR u.bio ILIKE $2)
       ORDER BY u.follower_count DESC, u.username ASC
       LIMIT $3 OFFSET $4`,
      [req.user?.userId || 0, searchTerm, limit, offset]
    );
    
    const countResult = await client.query(
      `SELECT COUNT(*) FROM users u
       WHERE (u.username ILIKE $1 OR u.full_name ILIKE $1 OR u.bio ILIKE $1)`,
      [searchTerm]
    );
    
    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalUsers: parseInt(countResult.rows[0].count),
        hasMore: offset + limit < countResult.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 인기 해시태그 조회
app.get('/api/search/trending-hashtags', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT unnest(hashtags) as hashtag, COUNT(*) as count
       FROM videos
       WHERE hashtags IS NOT NULL AND privacy = 'public'
       GROUP BY hashtag
       ORDER BY count DESC
       LIMIT 20`
    );
    
    res.json({ hashtags: result.rows });
    
  } catch (error) {
    console.error('인기 해시태그 조회 오류:', error);
    res.status(500).json({ error: '인기 해시태그를 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. (최대 100MB)' });
    }
  }
  
  if (!res.headersSent) {
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/videos/feed',
      'POST /api/videos/upload',
      'POST /api/login',
      'POST /api/register',
      'GET /api/profile',
      'GET /api/status',
      'GET /api/health'
    ]
  });
});

// 서버 시작 함수
async function startServer() {
  try {
    // videos 폴더 생성
    const videosDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
      console.log('📂 videos 폴더 생성됨');
    }
    
    // 기존 비디오 파일들 확인
    const files = fs.readdirSync(videosDir);
    console.log(`📁 videos 폴더에 ${files.length}개 파일 존재`);
    if (files.length > 0) {
      console.log('   파일 목록:', files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
    }
    
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 서버 시작
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=================================`);
      console.log(`🎬 StreamiFy 서버 시작!`);
      console.log(`🌐 로컬 접속: http://localhost:${PORT}`);
      console.log(`📱 네트워크 접속: http://192.168.45.199:${PORT}`);
      console.log(`🎥 비디오 스트리밍: http://192.168.45.199:${PORT}/videos/[filename]`);
      console.log(`🗄️  데이터베이스: PostgreSQL (streaming_app)`);
      console.log(`📁 비디오 폴더: ./videos`);
      console.log(`=================================`);
      
      console.log(`\n🔗 API 엔드포인트:`);
      console.log(`   피드: http://localhost:${PORT}/api/videos/feed`);
      console.log(`   상태: http://localhost:${PORT}/api/status`);
      console.log(`   헬스체크: http://localhost:${PORT}/api/health`);
      console.log(`   로그인: POST /api/login`);
      console.log(`   회원가입: POST /api/register`);
      console.log(`   업로드: POST /api/videos/upload`);
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// 우아한 종료 처리
process.on('SIGINT', async () => {
  console.log('\n👋 서버를 종료합니다...');
  
  try {
    await pool.end();
    console.log('✅ 데이터베이스 연결 종료됨');
  } catch (error) {
    console.error('DB 종료 오류:', error);
  }
  
  process.exit(0);
});

// 서버 시작
startServer();