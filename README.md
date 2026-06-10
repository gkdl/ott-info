# OTT Info

영화·드라마를 어디서 볼 수 있는지 한눈에 확인하는 커뮤니티 앱.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React Native (Expo SDK 52) |
| 언어 | TypeScript |
| 스타일 | NativeWind (Tailwind CSS) |
| 상태 관리 | TanStack Query v5 + Zustand v5 |
| 네비게이션 | Expo Router v4 |
| 이미지 | expo-image (memory-disk 캐싱) |
| 보안 스토리지 | expo-secure-store |
| 백엔드 | Supabase (PostgreSQL + Auth + Edge Functions) |
| 콘텐츠 API | TMDB (Edge Function 프록시 경유) |
| 인증 | 카카오 OAuth (Supabase Auth 연동) |

## 프로젝트 구조

```
ott-info/
├── src/
│   ├── app/                    # expo-router 페이지
│   │   ├── _layout.tsx         # 루트 레이아웃
│   │   ├── login.tsx           # 로그인 화면
│   │   ├── (tabs)/             # 탭 네비게이션
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx        # 홈 대시보드
│   │   │   ├── search.tsx      # 검색
│   │   │   └── mypage.tsx      # 마이페이지
│   │   └── detail/[id].tsx     # 상세 페이지
│   ├── components/
│   │   ├── home/               # 홈 섹션 컴포넌트
│   │   ├── detail/             # 상세 페이지 컴포넌트
│   │   ├── mypage/             # 마이페이지 컴포넌트
│   │   ├── shared/             # 공용 상태 UI (스켈레톤, 에러 등)
│   │   └── ui/                 # 기본 UI 컴포넌트
│   ├── hooks/                  # TanStack Query 훅
│   ├── lib/                    # 클라이언트 설정, 유틸
│   ├── services/               # Supabase 서비스 레이어
│   ├── store/                  # Zustand 스토어
│   └── types/                  # TypeScript 타입 정의
├── supabase/
│   ├── functions/
│   │   ├── tmdb-proxy/         # TMDB API 프록시 (JWT 검증 + rate limit)
│   │   └── delete-account/     # 회원탈퇴 (service_role)
│   └── config.toml
├── docs/
│   ├── admin-flow.md           # 신고 처리 운영 흐름
│   ├── privacy-compliance.md   # 개인정보·데이터 안전 준비 항목
│   └── store-launch-checklist.md  # 출시 전 점검 리스트
├── app.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── metro.config.js
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 EXPO_PUBLIC_* 값 입력
```

### 3. Supabase 설정

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인 및 프로젝트 연결
supabase login
supabase link --project-ref your-project-id

# Edge Function secrets 등록
supabase secrets set TMDB_API_KEY=your-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
supabase secrets set ADMIN_SECRET=your-random-secret

# Edge Functions 배포
supabase functions deploy tmdb-proxy --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

### 4. 앱 실행

```bash
npm start          # Expo Go / 개발 서버
npm run ios        # iOS 시뮬레이터
npm run android    # Android 에뮬레이터
```

## 보안 아키텍처 요약

- **TMDB API 키**: Edge Function secret에만 저장. 클라이언트 번들 미포함
- **service_role 키**: 회원탈퇴 Edge Function 내부에서만 사용
- **세션 토큰**: expo-secure-store (OS 키체인/키스토어) 암호화 저장
- **RLS**: 모든 테이블 활성화. 본인 데이터만 접근 가능
- **rate limiting**: TMDB 프록시 유저 60req/min, IP 120req/min
