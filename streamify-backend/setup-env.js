const fs = require('fs');
const path = require('path');

const envContent = `# 데이터베이스 설정
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_NAME=videoapp
DB_PORT=5432

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 서버 설정
PORT=3001
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env 파일이 생성되었습니다.');
  console.log('💡 DB_PASSWORD를 실제 PostgreSQL 비밀번호로 변경해주세요.');
} else {
  console.log('⚠️  .env 파일이 이미 존재합니다.');
} 