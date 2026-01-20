#!/bin/bash
# EAS가 전달하는 모든 인자 무시 (--platform 등)
# 이 스크립트는 인자 없이 실행되어야 하므로, 모든 인자를 무시합니다
# npx expo가 이 스크립트를 래핑할 때 --platform 같은 옵션을 전달하지만 무시

# 실제 실행할 Node.js 스크립트 호출 (인자 없이)
cd "$(dirname "$0")/.." || exit 1
node scripts/prepare-build.js
