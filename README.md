# 고기당 직원관리 앱

고기당 직원을 위한 근무 시간 관리 및 급여 확인 모바일 앱입니다.

## 주요 기능

### 직원 기능

- 📊 **급여 요약**: 실지급액, 총근무시간, 시급, 총급여, 총공제 확인
- 📅 **근무 캘린더**: 월별 근무 현황을 캘린더로 확인
- 📋 **근무 내역**: 상태별 필터링 (전체/대기중/승인됨/거부됨)
- ➕ **근무 등록**: 간편한 근무 시간 등록
- 📢 **공지사항**: 중요 공지 확인

### 관리자 기능

- ✅ **근무 승인**: 직원 근무 승인/거부
- 👥 **직원 관리**: 직원별 근무 통계 및 급여 관리
- 💰 **급여 관리**: 공제 항목 설정 및 급여 계산
- 📝 **공지 관리**: 공지사항 작성 및 관리

## 기술 스택

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Backend**: Supabase
- **Authentication**: Google Sign-In
- **UI Components**: React Native Paper, React Native Calendars
- **State Management**: React Hooks
- **Date Handling**: date-fns

## 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- iOS Simulator (Mac) 또는 Android Emulator

### 설치

```bash
# 저장소 클론
cd employee-management-mobile

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web

# Expo Go 앱으로 실행
npm start
# QR 코드 스캔
```

## 프로젝트 구조

```
employee-management-mobile/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── AnnouncementBanner.tsx
│   │   ├── WorkCalendar.tsx
│   │   ├── WorkLogModal.tsx
│   │   └── DeductionModal.tsx
│   ├── screens/            # 화면 컴포넌트
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── AdminScreen.tsx
│   │   └── EmployeeDetailScreen.tsx
│   ├── navigation/         # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   ├── config/            # 설정 파일
│   │   ├── supabase.ts
│   │   └── google.ts
│   ├── utils/             # 유틸리티 함수
│   │   └── timeUtils.ts
│   ├── styles/            # 스타일 정의
│   │   └── colors.ts
│   └── types/             # TypeScript 타입 정의
│       └── index.ts
├── assets/                # 이미지 및 폰트
├── app.json              # Expo 설정
├── eas.json              # EAS Build 설정
└── package.json          # 프로젝트 의존성
```

## 환경 변수

`.env` 파일 생성 (필요시):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
```

## 빌드 및 배포

### 개발 빌드

```bash
eas build --platform ios --profile development
```

### TestFlight (베타 테스트)

```bash
eas build --platform ios --profile preview
```

### App Store (프로덕션)

```bash
eas build --platform ios --profile production
```

또는 배포 스크립트 사용:

```bash
./deploy.sh
```

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

## 스크립트

```bash
# 개발 서버 시작
npm start

# iOS 빌드
npm run ios

# Android 빌드
npm run android

# 타입 체크
npm run type-check

# 린트
npm run lint
```

## 브랜드 컬러

- **Primary**: #8B4513 (갈색)
- **Gold**: #D4AF37 (골드)
- **Background**: #F5F1E8 (크림)
- **Dark**: #2D0A0A (다크 브라운)

## 라이선스

Copyright © 2024 고기당. All rights reserved.

## 지원

문제가 발생하거나 질문이 있으시면 관리자에게 문의하세요.

---

**Made with ❤️ for 고기당**
