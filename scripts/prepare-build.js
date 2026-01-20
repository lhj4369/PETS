const fs = require('fs');
const path = require('path');

// EAS가 전달할 수 있는 추가 인자 무시 (예: --platform android)
// process.argv를 확인하지만 실제로는 사용하지 않음

const frontendDir = path.join(__dirname, '..', 'frontend');
const rootDir = path.join(__dirname, '..');

// 복사해야 할 디렉토리 목록
const dirsToCopy = [
  'app',
  'components',
  'config',
  'context',
  'utils',
  'assets',
  'types',
  'features'
];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 필요한 디렉토리들을 루트로 복사
let copiedCount = 0;
dirsToCopy.forEach((dirName) => {
  const srcDir = path.join(frontendDir, dirName);
  const destDir = path.join(rootDir, dirName);
  
  if (fs.existsSync(srcDir)) {
    // 기존 디렉토리 삭제 (있는 경우)
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }
    
    // 디렉토리 복사
    copyRecursiveSync(srcDir, destDir);
    copiedCount++;
    console.log(`✅ frontend/${dirName} 디렉토리를 루트 ${dirName}으로 복사했습니다.`);
  } else {
    console.warn(`⚠️  frontend/${dirName} 디렉토리를 찾을 수 없습니다.`);
  }
});

if (copiedCount === 0) {
  console.error('❌ 복사할 디렉토리를 찾을 수 없습니다.');
  process.exit(1);
}

console.log(`\n✅ 총 ${copiedCount}개의 디렉토리를 복사했습니다.`);
