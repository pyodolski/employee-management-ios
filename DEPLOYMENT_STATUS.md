# 배포 준비 현황

**마지막 업데이트**: 2024년 12월 23일

---

## ✅ 완료된 작업

### 1. 문서 작성 완료

- ✅ `APP_STORE_CONTENT.md` - App Store Connect 제출용 메타데이터
- ✅ `SUPPORT_PAGE.md` - 지원 페이지 내용 (gogidang.com/support)
- ✅ `PRIVACY_POLICY.md` - 개인정보 처리방침 (gogidang.com/privacy)
- ✅ `IOS_BUILD_CHECKLIST.md` - iOS 빌드 체크리스트
- ✅ `DEPLOYMENT.md` - 배포 가이드

### 2. 앱 설정 확인

- ✅ `app.json` 설정 완료
  - 앱 이름: "고기당 직원관리"
  - Bundle ID: com.employeemanagement.app
  - Version: 1.0.0
  - Build Number: 1
  - 암호화 설정: ITSAppUsesNonExemptEncryption = false
- ✅ `eas.json` 빌드 설정 완료
  - Production 프로필 설정
  - 자동 빌드 번호 증가

### 3. 인증 정보 확인

- ✅ Supabase 설정 (`src/config/supabase.ts`)
  - URL: https://okvrxpjincelvvwnvcts.supabase.co
  - Anon Key: 설정됨
- ✅ Google OAuth 설정 (`src/config/google.ts`)
  - iOS Client ID: 설정됨
  - Web Client ID: 설정됨

### 4. 에셋 확인

- ✅ 앱 아이콘 (`assets/icon.png`)
  - 크기: 1024 x 1024 픽셀
  - 형식: PNG, RGBA
  - 용량: 117KB
- ✅ 스플래시 화면 (`assets/logo.jpg`)

  - 용량: 256KB
  - 배경색: #2d0a0a

- ✅ 기타 에셋
  - adaptive-icon.png (Android용)
  - favicon.png (웹용)
  - splash-icon.png

---

## ⚠️ 배포 전 필수 작업

### 1. 웹사이트 페이지 생성 (필수!)

- [ ] **gogidang.com/support** 페이지 배포
  - SUPPORT_PAGE.md 내용 사용
  - 반드시 App Store 제출 전에 생성
- [ ] **gogidang.com/privacy** 페이지 배포
  - PRIVACY_POLICY.md 내용 사용
  - 반드시 App Store 제출 전에 생성

### 2. 문서 플레이스홀더 교체

다음 파일들의 플레이스홀더를 실제 정보로 교체:

- [ ] APP_STORE_CONTENT.md
- [ ] SUPPORT_PAGE.md
- [ ] PRIVACY_POLICY.md

**교체 필요 항목:**

- `[담당자 이름]`
- `[직책]`
- `[전화번호]`
- `[이메일]`
- `[주소]`
- `[대표자명]`
- `[사업자번호]`

### 3. App Store 스크린샷 준비

- [ ] iPhone 6.7" (1290 x 2796) - 최소 3장
- [ ] iPhone 6.5" (1242 x 2688) - 최소 3장
- [ ] iPad Pro 12.9" (선택사항)

---

## 🚀 다음 단계

### 1. 빌드 생성

```bash
# EAS 로그인
eas login

# iOS 프로덕션 빌드
eas build --platform ios --profile production

# 빌드 상태 확인
eas build:list
```

### 2. App Store Connect 제출

1. 빌드 완료 후 `.ipa` 파일 다운로드
2. App Store Connect에 업로드
3. 메타데이터 입력 (APP_STORE_CONTENT.md 참고)
4. 스크린샷 업로드
5. 지원 URL 및 개인정보 처리방침 URL 입력
6. TestFlight 테스트 (선택사항)
7. 심사 제출

---

## 📋 빠른 체크리스트

**코드 & 설정**

- ✅ app.json 설정
- ✅ eas.json 설정
- ✅ 인증 정보 (Supabase, Google)
- ✅ 앱 아이콘 (1024x1024)
- ✅ 스플래시 화면

**문서**

- ✅ App Store 메타데이터 작성
- ✅ 지원 페이지 내용 작성
- ✅ 개인정보 처리방침 작성
- ⚠️ 플레이스홀더 교체 필요

**웹사이트**

- ⚠️ gogidang.com/support 배포 필요
- ⚠️ gogidang.com/privacy 배포 필요

**App Store 자료**

- ⚠️ 스크린샷 준비 필요

---

## 💡 참고사항

- 환경 변수 설정 불필요 (모든 인증 정보가 코드에 포함)
- EAS Build 무료 플랜: 월 30분 빌드 시간 제공
- 첫 빌드 예상 시간: 15-20분
- Apple Developer 계정 필요 (연간 $99)

---

**준비 완료 상태**: 80%
**남은 작업**: 웹사이트 페이지 배포, 스크린샷 준비, 플레이스홀더 교체
