# iOS 배포 빌드 체크리스트

## 📱 1. 필수 에셋 (Assets)

### 앱 아이콘

- **위치**: `assets/icon.png`
- **크기**: 1024x1024px
- **형식**: PNG (투명 배경 없음)
- **용도**: App Store 및 앱 아이콘

### 스플래시 스크린

- **위치**: `assets/logo.jpg`
- **배경색**: `#2d0a0a` (app.json에 설정됨)
- **용도**: 앱 시작 화면

### Adaptive 아이콘 (선택사항)

- **위치**: `assets/adaptive-icon.png`
- **크기**: 1024x1024px

---

## 🔐 2. 인증 정보 (Credentials)

### Supabase 설정

✅ **이미 코드에 하드코딩됨** (`src/config/supabase.ts`)

```
URL: https://okvrxpjincelvvwnvcts.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Google OAuth 설정

✅ **이미 코드에 하드코딩됨** (`src/config/google.ts`)

```
iOS Client ID: 168375852819-be8e8iknhsbcvgcrhqcnuasdr424dni7
Web Client ID: 168375852819-dat9f3u4e7d21qbdifj11bh00etfve0s
```

---

## 📋 3. app.json 설정 확인

### 필수 정보

- ✅ `name`: "고기당 직원관리"
- ✅ `slug`: "employee-management-mobile"
- ✅ `version`: "1.0.0"
- ✅ `bundleIdentifier`: "com.employeemanagement.app"
- ✅ `buildNumber`: "1"

### iOS 특정 설정

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.employeemanagement.app",
  "buildNumber": "1",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false,
    "CFBundleURLTypes": [...]
  }
}
```

---

## 🔑 4. Apple Developer 계정 필요 항목

### 인증서 & 프로비저닝

EAS Build가 자동으로 처리하지만, 필요시:

- Apple Developer 계정 (연간 $99)
- App Store Connect 접근 권한
- 번들 ID 등록: `com.employeemanagement.app`

---

## 📸 5. App Store Connect 제출 자료

### 스크린샷 (필수)

**iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)**

- 크기: 1290 x 2796 pixels
- 최소 3장, 최대 10장

**iPhone 6.5" (iPhone 11 Pro Max, XS Max)**

- 크기: 1242 x 2688 pixels
- 최소 3장, 최대 10장

**iPad Pro 12.9" (선택사항)**

- 크기: 2048 x 2732 pixels

### 앱 미리보기 영상 (선택사항)

- 최대 30초
- .mov, .m4v, .mp4 형식

---

## 📄 6. 메타데이터 (APP_STORE_CONTENT.md 참고)

### 필수 텍스트

- ✅ 앱 이름: "고기당 직원관리"
- ✅ 부제목: "프리미엄 숙성삼겹 직원 근무 관리"
- ✅ 설명: APP_STORE_CONTENT.md 참고
- ✅ 키워드: "직원관리,근무관리,급여,출퇴근,고기당"
- ✅ 지원 URL: https://gogidang.com/support
- ✅ 개인정보 처리방침 URL: https://gogidang.com/privacy

### 카테고리

- **주 카테고리**: 비즈니스
- **부 카테고리**: 생산성

### 연령 등급

- **만 17세 이상** (근무 관리 앱)

---

## 🌐 7. 웹사이트 페이지 (필수)

### 지원 페이지

- **URL**: https://gogidang.com/support
- **내용**: SUPPORT_PAGE.md 참고
- ⚠️ **반드시 배포 전에 생성 필요**

### 개인정보 처리방침

- **URL**: https://gogidang.com/privacy
- **내용**: PRIVACY_POLICY.md 참고
- ⚠️ **반드시 배포 전에 생성 필요**

---

## 🚀 8. 빌드 명령어

### Production 빌드 생성

```bash
# EAS 로그인
eas login

# iOS 프로덕션 빌드
eas build --platform ios --profile production

# 빌드 상태 확인
eas build:list
```

### 빌드 완료 후

1. EAS 대시보드에서 `.ipa` 파일 다운로드
2. App Store Connect에 업로드
3. TestFlight 테스트 (선택사항)
4. 심사 제출

---

## ✅ 9. 제출 전 최종 체크리스트

### 코드 & 설정

- [ ] app.json의 version과 buildNumber 확인
- [ ] bundleIdentifier가 Apple Developer에 등록되어 있는지 확인
- [ ] Google OAuth 설정 확인 (URL Scheme)
- [ ] Supabase 연결 테스트

### 에셋

- [ ] 앱 아이콘 (1024x1024) 준비
- [ ] 스크린샷 최소 3장 준비
- [ ] 스플래시 화면 확인

### 문서

- [ ] 지원 페이지 (gogidang.com/support) 배포
- [ ] 개인정보 처리방침 (gogidang.com/privacy) 배포
- [ ] APP_STORE_CONTENT.md의 플레이스홀더 교체
  - [ ] [담당자 이름]
  - [ ] [전화번호]
  - [ ] [이메일]
  - [ ] [주소]
  - [ ] [대표자명]

### App Store Connect

- [ ] 앱 이름, 부제목, 설명 입력
- [ ] 키워드 입력
- [ ] 카테고리 선택
- [ ] 연령 등급 설정
- [ ] 지원 URL 입력
- [ ] 개인정보 처리방침 URL 입력
- [ ] 스크린샷 업로드
- [ ] 가격 설정 (무료)

---

## 🔧 10. 빌드 설정 파일 (eas.json)

현재 설정:

```json
{
  "build": {
    "production": {
      "autoIncrement": true // buildNumber 자동 증가
    }
  }
}
```

---

## 💡 참고사항

### 환경 변수 불필요

- Supabase와 Google OAuth 정보가 코드에 하드코딩되어 있음
- 별도의 `.env` 파일이나 secrets 설정 불필요
- 빌드 시 추가 설정 없이 바로 진행 가능

### 빌드 시간

- 첫 빌드: 약 15-20분
- 이후 빌드: 약 10-15분

### 비용

- EAS Build: 무료 (월 30분 빌드 시간 제공)
- 추가 빌드 시간 필요시 유료 플랜 고려

---

## 📞 문제 발생 시

### 빌드 실패

```bash
# 로그 확인
eas build:list
eas build:view [BUILD_ID]
```

### 일반적인 문제

1. **인증서 문제**: EAS가 자동으로 처리하므로 대부분 자동 해결
2. **번들 ID 충돌**: Apple Developer에서 번들 ID 확인
3. **의존성 문제**: `npm install` 재실행

---

**마지막 업데이트**: 2024년 12월 23일
