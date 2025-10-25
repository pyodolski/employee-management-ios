# 고기당 직원관리 앱 - iOS 앱스토어 배포 가이드

## 사전 준비사항

### 1. Apple Developer 계정

- Apple Developer Program 가입 필요 ($99/년)
- https://developer.apple.com/programs/

### 2. 필요한 도구

- Xcode (Mac에서만 가능)
- EAS CLI 설치됨 ✅

## 배포 단계

### 1단계: 앱 아이콘 및 스플래시 준비

현재 로고 이미지를 앱 아이콘으로 변환해야 합니다:

```bash
# 로고 이미지를 assets 폴더에 배치
# - icon.png (1024x1024)
# - splash-icon.png (1284x2778)
# - adaptive-icon.png (1024x1024, Android용)
```

**아이콘 생성 도구:**

- https://www.appicon.co/ (무료)
- 로고 이미지를 업로드하면 모든 크기 자동 생성

### 2단계: EAS Build 설정 확인

```bash
cd employee-management-mobile

# EAS 로그인 (이미 완료됨)
eas login

# 빌드 설정 확인
cat eas.json
```

### 3단계: iOS 프로덕션 빌드 생성

```bash
# iOS 프로덕션 빌드 (앱스토어 제출용)
eas build --platform ios --profile production

# 빌드 진행 상황 확인
# - Apple Developer 계정 연동
# - 인증서 및 프로비저닝 프로파일 자동 생성
# - 빌드 완료 후 .ipa 파일 다운로드 링크 제공
```

**빌드 옵션:**

- `production`: 앱스토어 제출용
- `preview`: 테스트용 (TestFlight)
- `development`: 개발용

### 4단계: App Store Connect 설정

1. **App Store Connect 접속**

   - https://appstoreconnect.apple.com/

2. **새 앱 생성**

   - "나의 앱" → "+" → "새로운 앱"
   - 플랫폼: iOS
   - 이름: 고기당 직원관리
   - 기본 언어: 한국어
   - 번들 ID: com.gogidang.employee
   - SKU: gogidang-employee-001

3. **앱 정보 입력**

   - 카테고리: 비즈니스
   - 연령 등급: 4+
   - 개인정보 처리방침 URL 필요

4. **스크린샷 준비**
   - iPhone 6.7" (필수): 1290 x 2796
   - iPhone 6.5" (필수): 1242 x 2688
   - iPad Pro 12.9" (선택): 2048 x 2732

### 5단계: TestFlight 테스트 (선택사항)

```bash
# TestFlight용 빌드
eas build --platform ios --profile preview

# 빌드 완료 후 자동으로 TestFlight에 업로드됨
```

**TestFlight 설정:**

1. App Store Connect → TestFlight
2. 내부 테스터 추가
3. 테스트 정보 입력
4. 테스터에게 초대 발송

### 6단계: 앱스토어 제출

```bash
# 프로덕션 빌드 생성
eas build --platform ios --profile production

# 또는 EAS Submit 사용 (자동 제출)
eas submit --platform ios
```

**수동 제출 방법:**

1. EAS 빌드 완료 후 .ipa 파일 다운로드
2. Xcode → Window → Organizer
3. .ipa 파일을 Organizer로 드래그
4. "Distribute App" → "App Store Connect"
5. 업로드 완료 후 App Store Connect에서 확인

### 7단계: 앱 심사 제출

1. **App Store Connect에서 앱 정보 완성**

   - 앱 이름: 고기당 직원관리
   - 부제: 프리미엄 숙성삼겹 직원 근무 관리
   - 설명:

     ```
     고기당 직원을 위한 근무 시간 관리 및 급여 확인 앱입니다.

     주요 기능:
     • 근무 시간 등록 및 관리
     • 월별 급여 요약 확인
     • 근무 캘린더
     • 공지사항 확인
     • 관리자 승인 시스템
     ```

   - 키워드: 근무관리,급여,직원,고기당,출퇴근
   - 지원 URL: 웹사이트 URL
   - 마케팅 URL: (선택사항)

2. **스크린샷 업로드**

   - 앱 실행 화면 캡처
   - 주요 기능 화면 5-10장

3. **앱 심사 정보**

   - 연락처 정보
   - 데모 계정 (심사용)
   - 참고사항

4. **심사 제출**
   - "심사를 위해 제출" 버튼 클릭
   - 평균 심사 기간: 1-3일

## 배포 체크리스트

### 필수 사항

- [ ] Apple Developer 계정 가입
- [ ] 앱 아이콘 준비 (1024x1024)
- [ ] 스플래시 이미지 준비
- [ ] 스크린샷 준비 (5-10장)
- [ ] 개인정보 처리방침 URL
- [ ] 앱 설명 및 키워드 작성
- [ ] 데모 계정 준비 (심사용)

### 선택 사항

- [ ] TestFlight 베타 테스트
- [ ] 앱 프리뷰 비디오 (15-30초)
- [ ] 프로모션 텍스트

## 빌드 프로필 설정 (eas.json)

현재 설정:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

## 자주 묻는 질문

### Q: 빌드 시간은 얼마나 걸리나요?

A: 평균 15-30분 소요됩니다.

### Q: 앱 심사는 얼마나 걸리나요?

A: 평균 1-3일, 최대 1주일까지 걸릴 수 있습니다.

### Q: 심사 거절 시 어떻게 하나요?

A: 거절 사유를 확인하고 수정 후 재제출합니다.

### Q: 업데이트는 어떻게 하나요?

A: app.json의 version을 올리고 동일한 과정을 반복합니다.

## 비용

- Apple Developer Program: $99/년
- EAS Build: 무료 (월 30회 제한)
- EAS Submit: 무료

## 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS Build 가이드](https://docs.expo.dev/build/introduction/)
- [App Store 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect 도움말](https://help.apple.com/app-store-connect/)

## 문제 해결

### 빌드 실패 시

```bash
# 캐시 클리어
eas build:clear

# 다시 빌드
eas build --platform ios --profile production --clear-cache
```

### 인증서 문제 시

```bash
# 인증서 재생성
eas credentials
```

## 다음 단계

1. ✅ 앱 개발 완료
2. ⏳ 앱 아이콘 및 스크린샷 준비
3. ⏳ Apple Developer 계정 설정
4. ⏳ 프로덕션 빌드 생성
5. ⏳ App Store Connect 설정
6. ⏳ 앱 심사 제출
7. ⏳ 앱스토어 출시

---

**준비되면 다음 명령어로 시작하세요:**

```bash
cd employee-management-mobile
eas build --platform ios --profile production
```
