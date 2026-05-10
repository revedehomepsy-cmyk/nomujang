# 노무장 (Nomujang)

현장 노무 관리 PWA — Next.js 14 + Prisma + NextAuth + PostgreSQL.

## 주요 기능

### 현장소장 모드
- 프로젝트 등록/관리
- 날짜·공정·프로젝트별 반장님과 총 작업자 수 입력
- 반장 출퇴근 사진 확인

### 일용직 근로자 (반장) 모드
- 카메라로 얼굴 사진 출퇴근 기록
- 팀장 반장은 총 품수와 비용(품당 단가) 입력 가능

### 관리자 모드
- **품수 크로스 체크**: 현장소장이 입력한 작업자수 vs 반장이 입력한 품수 비교 (불일치 하이라이트)
- **세금/보험 비교**: 일용직 신고 vs 사업소득 3.3% 신고 시 실수령액·세금·4대보험 자동 비교 (요율 수정 가능)
- **세무사 메일 발송**: 지급월 기준 자동 집계 → 표 안 금액 임의 수정 → 세무사 이메일로 CSV 첨부 발송

---

## 🚀 Vercel 배포 가이드 (가장 빠른 시작)

### 1. PostgreSQL DB 만들기 (무료)

아래 중 하나 선택:

#### 옵션 A: Neon (가장 빠름, 추천)
1. https://neon.tech 가입
2. "Create Project" → 이름 아무거나, Region은 `Asia Pacific (Tokyo)` 같은 가까운 곳
3. 생성되면 **Connection String** 복사 (예: `postgresql://user:pass@xxx.neon.tech/neondb?sslmode=require`)

#### 옵션 B: Vercel Postgres
1. Vercel에서 프로젝트 만든 뒤 → Storage → Create Database → Postgres
2. 자동으로 `DATABASE_URL` 환경변수가 연결됨

### 2. Vercel에 배포

1. https://vercel.com 가입 후 GitHub 연결
2. **Add New → Project** → 본인의 `nomujang` 리포지토리 선택
3. **Branch**를 `claude/import-github-code-rra5k` 로 지정
4. **Environment Variables** 추가:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | (1번에서 복사한 Connection String) |
   | `NEXTAUTH_SECRET` | 아무 긴 랜덤 문자열 (예: `openssl rand -base64 32` 결과) |
   | `NEXTAUTH_URL` | (배포 후 받은 URL, 예: `https://nomujang-xxx.vercel.app`) |
   | `SEED_SECRET` | 임의의 긴 문자열 (시드 endpoint 보호용) |
   | `SMTP_HOST` 등 | (메일 발송 안 할 거면 비워두기) |

   > 💡 `NEXTAUTH_URL`은 처음에는 모르니 일단 `https://example.com` 같은 더미값으로 넣고, 배포 완료 후 진짜 도메인으로 수정 → 재배포 하세요.

5. **Deploy** 클릭. 빌드 로그에 "✓ Generated Prisma Client" 와 테이블 생성이 보이면 성공.

### 3. 시드 데이터 넣기 (1회만)

배포 완료 후 브라우저에서 한 번만 접속:

```
https://your-domain.vercel.app/api/seed?secret=YOUR_SEED_SECRET
```

`{"ok":true, "counts": {...}, "accounts": [...]}` 가 나오면 성공.
이걸 누르면 시드 계정 3개 + 공정 12개가 추가됩니다 (이미 있으면 그냥 통과).

### 4. 로그인

본인 도메인 메인 페이지 → 자동으로 로그인 화면 → 아래 계정으로 로그인 (비밀번호 모두 `test1234`):

| 이메일 | 역할 |
|---|---|
| admin@nomujang.kr | 관리자 |
| site@nomujang.kr | 현장소장 |
| foreman@nomujang.kr | 반장 (팀장) |

> ⚠️ 운영 시작하면 **반드시 시드 계정의 비밀번호를 바꾸거나 삭제**하세요.

### 5. PWA 설치 (폰)

배포된 https URL을 폰 Chrome/Safari로 접속 → 메뉴 → "홈 화면에 추가" 하면 앱처럼 사용할 수 있고 카메라 출퇴근도 동작합니다.

---

## 로컬 개발 (선택)

```bash
npm install
cp .env.example .env
# .env 파일 열어서 DATABASE_URL 에 PostgreSQL 연결 문자열 입력
# NEXTAUTH_SECRET 도 채우기

npx prisma db push    # 테이블 생성
npm run db:seed       # 시드 계정/공정 추가

npm run dev
# http://localhost:3000 접속
```

> 로컬에서도 PostgreSQL이 필요합니다. Neon 무료 DB를 만들어 dev/prod 동일하게 써도 되고, 로컬에 Postgres 띄워도 됩니다.

## SMTP 설정 (세무사 메일)

`.env` 또는 Vercel 환경변수에 채우면 실제로 메일이 발송됩니다.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...   # Gmail은 "앱 비밀번호" 발급 필요
SMTP_FROM=nomujang@example.com
```

비워두면 자료는 DB에 저장되지만 메일은 발송되지 않습니다.

## 세금/보험 표준 공식

표준 공식으로 자동 계산되며, **실제 신고는 세무사와 최종 확인이 필요**합니다.

- 일용직 소득세: `(일급 - 150,000) × 6% × (1 - 55%) = 일급 초과분의 2.7%`, 일별 1,000원 미만은 면제
- 지방소득세: 소득세 × 10%
- 사업소득 원천징수: 지급액 × 3% (지방세 0.3% 포함 시 3.3%)
- 4대보험 (1개월 미만 일용직 가정):
  - 국민연금/건강보험: 0
  - 고용보험: 0.9% (근로자)
  - 산재보험: 0 (사업주 부담)

요율은 관리자 화면에서 직접 수정해 시뮬레이션할 수 있습니다.

## 기술 스택

- **Frontend / Backend**: Next.js 14 (App Router), TypeScript
- **DB**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth (Credentials, JWT 세션)
- **Styling**: Tailwind CSS
- **PWA**: 매니페스트 + 간단한 service worker (production 빌드에서 활성)
- **Camera**: Web `getUserMedia` API

## 디렉토리

```
src/
  app/                  # Next.js App Router (페이지 + API)
    site-manager/       # 현장소장
    foreman/            # 반장
    admin/              # 관리자
    api/                # REST endpoints
      seed/             # 1회용 시드 endpoint (SEED_SECRET 보호)
  components/           # 공용 컴포넌트 (TopNav, CameraCapture)
  lib/                  # auth, prisma, tax, email, guard
  types/                # NextAuth 세션 타입 확장
prisma/
  schema.prisma         # DB 스키마 (PostgreSQL)
  seed.ts               # 로컬 시드 스크립트
public/
  manifest.webmanifest  # PWA 매니페스트
  sw.js                 # Service worker
  icon.svg              # 앱 아이콘
```
