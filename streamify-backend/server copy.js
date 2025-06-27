// server.js - 완성된 백엔드 서버
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourapp.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 데이터베이스 연결
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'videoapp',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 정적 파일 제공 (비디오)
app.use('/videos', express.static(path.join(__dirname, 'videos'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// 지원하는 파일 형식
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
  'video/wmv', 'video/flv', 'video/mkv', 'video/x-matroska', 'video/x-msvideo',
  'video/quicktime', 'video/mpeg'
];

const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/bmp', 'image/tiff', 'image/svg+xml'
];

const SUPPORTED_FORMATS = [...SUPPORTED_VIDEO_FORMATS, ...SUPPORTED_IMAGE_FORMATS];

// 파일명 안전화 함수
const sanitizeFilename = (originalName) => {
  try {
    const decodedName = decodeURIComponent(originalName);
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
    
    return safeName + ext;
  } catch (error) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName).toLowerCase() || '.mp4';
    return `video-${timestamp}-${random}${ext}`;
  }
};

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, sanitizedName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_FORMATS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 유틸리티 함수들
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
};

const getVideoMetadata = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      size: stats.size,
      duration: 30, // 실제로는 ffprobe를 사용해야 함
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      format: ext.substring(1),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      size: 0,
      duration: 0,
      width: 1080,
      height: 1920,
      aspectRatio: '9:16'
    };
  }
};

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 선택적 인증 미들웨어
const optionalAuth = (req, res, next) => {
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
};

// ================================
// 인증 API
// ================================

// 회원가입
app.post('/api/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, password, fullName } = req.body;
    
    // 입력 검증
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    }
    
    // 중복 검사
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '이미 사용 중인 사용자명 또는 이메일입니다.' });
    }
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const result = await client.query(
      `INSERT INTO users (username, email, password, full_name, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, username, email, full_name`,
      [username, email, hashedPassword, fullName]
    );
    
    const newUser = result.rows[0];
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.full_name
      }
    });
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
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
      return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }
    
    // 사용자 조회
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    const user = result.rows[0];
    
    // 비밀번호 확인
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      message: '로그인되었습니다.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio
      }
    });
    
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 프로필 조회
app.get('/api/profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT u.*, 
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
              (SELECT COUNT(*) FROM videos WHERE user_id = u.id) as video_count
       FROM users u 
       WHERE u.id = $1`,
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
        email: user.email,
        fullName: user.full_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        followerCount: parseInt(user.follower_count),
        followingCount: parseInt(user.following_count),
        videoCount: parseInt(user.video_count)
      }
    });
    
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '프로필을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// ================================
// 비디오 API
// ================================

// 비디오 피드 조회
app.get('/api/videos/feed', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const following = req.query.following === 'true';
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT DISTINCT
        v.id, v.title, v.description, v.filename, v.original_name, 
        v.file_size, v.duration, v.width, v.height, v.aspect_ratio, 
        v.views, v.likes, v.shares, v.hashtags, v.location, 
        v.created_at, v.privacy,
        u.id as uploader_id, u.username as uploader, u.full_name as uploader_full_name, 
        u.avatar_url as uploader_avatar, u.is_verified as uploader_verified,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as uploader_followers,
        (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count,
        COALESCE(v.filetype, 'video') as filetype
    `;
    
    let params = [limit, offset];
    
    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $3) as is_liked_by_user,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = $3 AND following_id = u.id) as is_following_uploader
      `;
      params.push(userId);
    } else {
      query += `,
        false as is_liked_by_user,
        false as is_following_uploader
      `;
    }
    
    query += `
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.privacy = 'public'
    `;
    
    if (following && userId) {
      query += ` AND u.id IN (SELECT following_id FROM follows WHERE follower_id = $${params.length - 1})`;
    }
    
    query += `
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await client.query(query, params);
    
    // 비디오 파일 존재 여부 확인
    const videos = result.rows.map(video => {
      if (!video.filename) return null;
      
      const filePath = path.join(__dirname, 'videos', video.filename);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      return {
        id: video.id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        originalName: video.original_name,
        uploaderId: video.uploader_id,
        uploader: video.uploader,
        uploaderFullName: video.uploader_full_name,
        uploaderAvatar: video.uploader_avatar,
        uploaderFollowers: parseInt(video.uploader_followers) || 0,
        uploaderVerified: video.uploader_verified || false,
        views: parseInt(video.views) || 0,
        likes: parseInt(video.likes) || 0,
        comments: parseInt(video.comments_count) || 0,
        shares: parseInt(video.shares) || 0,
        hashtags: video.hashtags || [],
        location: video.location,
        createdAt: getTimeAgo(video.created_at),
        isLiked: video.is_liked_by_user || false,
        isFollowingUploader: video.is_following_uploader || false,
        isPublic: video.privacy === 'public',
        aspectRatio: video.aspect_ratio || '9:16',
        fileSize: video.file_size,
        duration: video.duration,
        width: video.width,
        height: video.height,
        filetype: video.filetype
      };
    });
    
    const validVideos = videos.filter(v => v !== null);
    
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
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
    }
    
    const { originalname, filename, size, mimetype } = req.file;
    const { title, description, hashtags, location, isPrivate } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: '제목을 입력해주세요.' });
    }
    
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
    
    // 파일 타입 결정
    const filetype = SUPPORTED_VIDEO_FORMATS.includes(mimetype) ? 'video' : 'image';
    
    // 데이터베이스에 저장
    const result = await client.query(
      `INSERT INTO videos (
        user_id, filename, original_name, title, description, hashtags, 
        location, privacy, file_size, duration, width, height, 
        aspect_ratio, filetype, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
      RETURNING id, created_at`,
      [
        req.user.userId, filename, originalname, title.trim(), 
        description?.trim() || null, hashtagArray, location?.trim() || null,
        isPrivate === 'true' ? 'private' : 'public', size, metadata.duration,
        metadata.width, metadata.height, metadata.aspectRatio, filetype
      ]
    );
    
    const video = result.rows[0];
    
    res.status(201).json({
      message: '비디오가 성공적으로 업로드되었습니다.',
      video: {
        id: video.id,
        filename: filename,
        title: title.trim(),
        description: description?.trim() || null,
        hashtags: hashtagArray,
        location: location?.trim() || null,
        isPrivate: isPrivate === 'true',
        fileSize: size,
        filetype: filetype,
        createdAt: video.created_at
      }
    });
    
  } catch (error) {
    console.error('비디오 업로드 오류:', error);
    
    // 업로드 실패 시 파일 삭제
    if (req.file && req.file.filename) {
      const filePath = path.join(__dirname, 'videos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: '비디오 업로드 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 비디오 좋아요 토글
app.post('/api/videos/:id/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: '유효하지 않은 비디오 ID입니다.' });
    }
    
    // 이미 좋아요 했는지 확인
    const existingLike = await client.query(
      'SELECT id FROM likes WHERE video_id = $1 AND user_id = $2',
      [videoId, userId]
    );
    
    let liked = false;
    
    if (existingLike.rows.length > 0) {
      // 좋아요 취소
      await client.query(
        'DELETE FROM likes WHERE video_id = $1 AND user_id = $2',
        [videoId, userId]
      );
      await client.query(
        'UPDATE videos SET likes = likes - 1 WHERE id = $1',
        [videoId]
      );
      liked = false;
    } else {
      // 좋아요 추가
      await client.query(
        'INSERT INTO likes (video_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [videoId, userId]
      );
      await client.query(
        'UPDATE videos SET likes = likes + 1 WHERE id = $1',
        [videoId]
      );
      liked = true;
    }
    
    // 현재 좋아요 수 조회
    const likesResult = await client.query(
      'SELECT likes FROM videos WHERE id = $1',
      [videoId]
    );
    
    const likesCount = likesResult.rows[0]?.likes || 0;
    
    res.json({
      liked,
      likesCount,
      message: liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.'
    });
    
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ================================
// 댓글 API
// ================================

// 댓글 조회
app.get('/api/videos/:id/comments', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user?.userId;
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: '유효하지 않은 비디오 ID입니다.' });
    }
    
    let query = `
      SELECT 
        c.id, c.content, c.created_at, c.parent_comment_id, 
        COALESCE(c.likes_count, 0) as likes_count, 
        COALESCE(c.replies_count, 0) as replies_count,
        u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified
    `;
    
    let params = [videoId];
    
    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2) as is_liked_by_user
      `;
      params.push(userId);
    } else {
      query += `,
        false as is_liked_by_user
      `;
    }
    
    query += `
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.video_id = $1 AND c.parent_comment_id IS NULL
      ORDER BY c.created_at DESC
    `;
    
    const result = await client.query(query, params);
    
    res.json({ 
      comments: result.rows.map(comment => ({
        ...comment,
        timeAgo: getTimeAgo(comment.created_at)
      }))
    });
    
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({ error: '댓글을 불러올 수 없습니다.' });
  } finally {
    client.release();
  }
});

// 댓글 작성
app.post('/api/videos/:id/comments', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const videoId = parseInt(req.params.id);
    const { content, parentCommentId } = req.body;
    
    if (isNaN(videoId)) {
      return res.status(400).json({ error: '유효하지 않은 비디오 ID입니다.' });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }
    
    const result = await client.query(
      `INSERT INTO comments (video_id, user_id, content, parent_comment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, content, created_at, parent_comment_id`,
      [videoId, req.user.userId, content.trim(), parentCommentId || null]
    );
    
    const comment = result.rows[0];
    
    // 댓글 수 업데이트
    if (!parentCommentId) {
      await client.query(
        'UPDATE videos SET comments_count = comments_count + 1 WHERE id = $1',
        [videoId]
      );
    } else {
      await client.query(
        'UPDATE comments SET replies_count = replies_count + 1 WHERE id = $1',
        [parentCommentId]
      );
    }
    
    res.status(201).json({ 
      comment: {
        ...comment,
        timeAgo: getTimeAgo(comment.created_at)
      },
      message: '댓글이 작성되었습니다.'
    });
    
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 댓글 좋아요 토글
app.post('/api/comments/:id/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    if (isNaN(commentId)) {
      return res.status(400).json({ error: '유효하지 않은 댓글 ID입니다.' });
    }
    
    // comment_likes 테이블이 없다면 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);
    
    // comments 테이블에 likes_count 컬럼이 없다면 추가
    await client.query(`
      ALTER TABLE comments 
      ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0
    `);
    
    // 이미 좋아요 했는지 확인
    const existingLike = await client.query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );
    
    let liked = false;
    
    if (existingLike.rows.length > 0) {
      // 좋아요 취소
      await client.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      );
      await client.query(
        'UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1',
        [commentId]
      );
      liked = false;
    } else {
      // 좋아요 추가
      await client.query(
        'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [commentId, userId]
      );
      await client.query(
        'UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1',
        [commentId]
      );
      liked = true;
    }
    
    // 현재 좋아요 수 조회
    const likesResult = await client.query(
      'SELECT likes_count FROM comments WHERE id = $1',
      [commentId]
    );
    
    const likesCount = likesResult.rows[0]?.likes_count || 0;
    
    res.json({
      liked,
      likesCount,
      message: liked ? '댓글에 좋아요를 눌렀습니다.' : '댓글 좋아요를 취소했습니다.'
    });
    
  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error);
    res.status(500).json({ error: '댓글 좋아요 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ================================
// 팔로우 시스템 API
// ================================

// 사용자 팔로우 토글
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
    
    let isFollowing = false;
    
    if (existingFollow.rows.length > 0) {
      // 언팔로우
      await client.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, targetUserId]
      );
      isFollowing = false;
    } else {
      // 팔로우
      await client.query(
        'INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW())',
        [followerId, targetUserId]
      );
      isFollowing = true;
    }
    
    // 팔로워 수 조회
    const followerCountResult = await client.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [targetUserId]
    );
    
    const followerCount = parseInt(followerCountResult.rows[0].count);
    
    res.json({
      isFollowing,
      followerCount,
      message: isFollowing ? '팔로우했습니다.' : '언팔로우했습니다.'
    });
    
  } catch (error) {
    console.error('팔로우 토글 오류:', error);
    res.status(500).json({ error: '팔로우 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ================================
// 상태 및 헬스체크 API
// ================================

// 헬스체크
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 서버 상태
app.get('/api/status', (req, res) => {
  const videosDir = path.join(__dirname, 'videos');
  const videoFiles = fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : [];
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'running',
    videos_folder_exists: fs.existsSync(videosDir),
    video_files_count: videoFiles.length,
    version: '2.0.0'
  });
});

// ================================
// 에러 처리
// ================================

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
      'GET /api/health',
      'GET /api/status',
      'POST /api/register',
      'POST /api/login',
      'GET /api/profile',
      'GET /api/videos/feed',
      'POST /api/videos/upload',
      'POST /api/videos/:id/like',
      'GET /api/videos/:id/comments',
      'POST /api/videos/:id/comments',
      'POST /api/comments/:id/like',
      'POST /api/users/:id/follow'
    ]
  });
});

// ================================
// 서버 시작
// ================================

async function startServer() {
  try {
    // videos 폴더 생성
    const videosDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
      console.log('📂 videos 폴더 생성됨');
    }
    
    // 데이터베이스 연결 테스트
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📱 API 문서: http://localhost:${PORT}/api/status`);
      console.log(`🎥 비디오 업로드 경로: ${videosDir}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔧 개발 모드에서 실행 중`);
      }
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();