## PETS Docker 실행 가이드

### 요구사항
- Windows: **Docker Desktop** 설치 및 실행
- `docker` / `docker compose` 명령이 PowerShell에서 동작해야 합니다.

확인:

```bash
docker --version
docker compose version
```

### 구성
- **mysql**: `mysql:8.4` (DB `pets`, 유저 `pets`)
- **backend**: Express API (기본 `4000`)
- **frontend**: Expo Web 정적 빌드 후 nginx로 서빙 (`8080`)

### 최초 실행
프로젝트 루트(`docker-compose.yml` 있는 폴더)에서:

```bash
docker compose up --build
```

열리는 주소:
- frontend: `http://localhost:8080`
- backend: `http://localhost:4000`
- mysql: `localhost:3306`

### DB 초기화(자동)
새 볼륨으로 처음 뜰 때 MySQL이 아래 파일을 자동 실행합니다:
- `docker/mysql/init/01_schema.sql`

이미 DB 볼륨이 생성된 상태에서 스키마를 다시 초기화하려면(데이터 삭제):

```bash
docker compose down -v
docker compose up --build
```

### 환경변수(중요)
`docker-compose.yml`에 기본값이 들어있습니다.
- backend는 컨테이너 내부에서 `DB_HOST=mysql`로 접속합니다.
- frontend는 빌드 시점에 `EXPO_PUBLIC_API_BASE_URL`을 주입합니다(기본: `http://localhost:4000`).

운영용으로는 아래는 꼭 바꾸세요:
- `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`
- `JWT_SECRET`
- `GEMINI_API_KEY`

