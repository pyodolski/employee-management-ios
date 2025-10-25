#!/bin/bash

# 고기당 직원관리 앱 배포 스크립트

echo "🚀 고기당 직원관리 앱 배포 시작"
echo "================================"
echo ""

# 현재 버전 확인
VERSION=$(grep -o '"version": "[^"]*' app.json | cut -d'"' -f4)
echo "📱 현재 버전: $VERSION"
echo ""

# 배포 타입 선택
echo "배포 타입을 선택하세요:"
echo "1) TestFlight (베타 테스트)"
echo "2) App Store (프로덕션)"
echo "3) 개발 빌드"
echo ""
read -p "선택 (1-3): " choice

case $choice in
  1)
    echo ""
    echo "🧪 TestFlight 빌드 시작..."
    eas build --platform ios --profile preview
    ;;
  2)
    echo ""
    echo "🏪 App Store 프로덕션 빌드 시작..."
    eas build --platform ios --profile production
    ;;
  3)
    echo ""
    echo "🔧 개발 빌드 시작..."
    eas build --platform ios --profile development
    ;;
  *)
    echo "❌ 잘못된 선택입니다."
    exit 1
    ;;
esac

echo ""
echo "✅ 빌드 명령이 실행되었습니다."
echo "📊 진행 상황은 https://expo.dev 에서 확인하세요."
echo ""
echo "빌드 완료 후:"
echo "- TestFlight: 자동으로 업로드됩니다"
echo "- App Store: App Store Connect에서 심사 제출"
echo ""
