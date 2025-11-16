// JWT 시크릿 키 생성 스크립트
import crypto from 'crypto';

// 64바이트(512비트) 랜덤 문자열 생성
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT 시크릿 키가 생성되었습니다!\n');
console.log('다음 값을 .env 파일의 JWT_SECRET에 복사하세요:\n');
console.log(secret);
console.log('\n⚠️  이 키는 안전하게 보관하세요. 공개하지 마세요!\n');
