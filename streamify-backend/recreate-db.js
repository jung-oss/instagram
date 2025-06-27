require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'videoapp',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function recreateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  기존 테이블 완전 삭제 중...');
    
    // 기존 테이블 삭제 (순서 중요)
    await client.query('DROP TABLE IF EXISTS comment_likes CASCADE');
    await client.query('DROP TABLE IF EXISTS likes CASCADE');
    await client.query('DROP TABLE IF EXISTS comments CASCADE');
    await client.query('DROP TABLE IF EXISTS follows CASCADE');
    await client.query('DROP TABLE IF EXISTS videos CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ 기존 테이블 삭제 완료');
    
    console.log('🏗️  새로운 테이블 생성 중...');
    
    // users 테이블
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users 테이블 생성 완료');

    // videos 테이블
    await client.query(`
      CREATE TABLE videos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        hashtags TEXT[],
        location VARCHAR(255),
        privacy VARCHAR(20) DEFAULT 'public',
        file_size BIGINT,
        duration INTEGER,
        width INTEGER,
        height INTEGER,
        aspect_ratio VARCHAR(10),
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        filetype VARCHAR(20) DEFAULT 'video',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ videos 테이블 생성 완료');

    // likes 테이블
    await client.query(`
      CREATE TABLE likes (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id)
      )
    `);
    console.log('✅ likes 테이블 생성 완료');

    // comments 테이블
    await client.query(`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ comments 테이블 생성 완료');

    // comment_likes 테이블
    await client.query(`
      CREATE TABLE comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);
    console.log('✅ comment_likes 테이블 생성 완료');

    // follows 테이블
    await client.query(`
      CREATE TABLE follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);
    console.log('✅ follows 테이블 생성 완료');

    // 권한 설정
    console.log('🔐 권한 설정 중...');
    await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres');
    await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres');
    console.log('✅ 권한 설정 완료');

    // 샘플 데이터 추가
    console.log('📝 샘플 데이터 추가 중...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (username, email, password, full_name, bio) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `, ['demo_user', 'demo@example.com', hashedPassword, '데모 사용자', '샘플 계정입니다.']);
    
    const userId = userResult.rows[0].id;
    console.log('✅ 샘플 사용자 추가 완료 (ID:', userId, ')');

    console.log('🎉 데이터베이스 재생성 완료!');
    console.log('💡 이제 서버를 실행하세요: npm start');
    
  } catch (error) {
    console.error('❌ 데이터베이스 재생성 실패:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recreateDatabase().catch(console.error); 