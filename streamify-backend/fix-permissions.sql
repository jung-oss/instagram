-- fix-permissions.sql - 데이터베이스 권한 수정
-- PostgreSQL에 직접 연결해서 실행하거나 pgAdmin에서 실행

-- 1. 현재 사용자 확인
SELECT current_user, current_database();

-- 2. 테이블 소유자 확인
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 4. 향후 생성될 테이블에 대한 권한도 부여
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- 5. 특정 테이블들에 대한 권한 확인 및 부여
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
GRANT ALL PRIVILEGES ON TABLE videos TO postgres;
GRANT ALL PRIVILEGES ON TABLE likes TO postgres;
GRANT ALL PRIVILEGES ON TABLE comments TO postgres;
GRANT ALL PRIVILEGES ON TABLE follows TO postgres;
GRANT ALL PRIVILEGES ON TABLE comment_likes TO postgres;

-- 6. 시퀀스 권한도 부여
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 7. 권한 확인
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND grantee = 'postgres'
ORDER BY table_name, privilege_type; 