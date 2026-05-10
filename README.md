# 노무장 (Nomujang)

현장 노무 관리 PWA — Next.js 14 + Prisma + NextAuth.

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

## 시작하기

```bash
npm install
cp .env.example .env

# DB 생성
npx prisma db push

# 시드 (테스트 계정/공정 추가)
npm run db:seed

npm run dev
```

브라우저에서 http://localhost:3000 접속.

### 시드 계정 (비밀번호: `test1234`)

| 이메일 | 역할 |
|---|---|
| admin@nomujang.kr | 관리자 |
| site@nomujang.kr | 현장소장 |
| foreman@nomujang.kr | 반장 (팀장) |

## SMTP 설정 (세무사 메일)

`.env` 에 SMTP 정보를 채워주세요.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=nomujang@example.com
```

비워두면 메일은 발송되지 않고 신고자료만 DB에 저장됩니다.

## 세금/보험 표준 공식

표준 공식으로 자동 계산되며, 실제 신고는 세무사와 최종 확인이 필요합니다.

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
- **DB**: SQLite (Prisma ORM) — Postgres로 손쉽게 전환 가능
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
  components/           # 공용 컴포넌트 (TopNav, CameraCapture)
  lib/                  # auth, prisma, tax, email, guard
  types/                # NextAuth 세션 타입 확장
prisma/
  schema.prisma         # DB 스키마
  seed.ts               # 시드 스크립트
public/
  manifest.webmanifest  # PWA 매니페스트
  sw.js                 # Service worker
  icon.svg              # 앱 아이콘
```
