import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { supabase } from "../config/supabase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_CONFIG } from "../config/google";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Google Sign-In 설정
    GoogleSignin.configure({
      iosClientId: GOOGLE_CONFIG.iosClientId,
      webClientId: GOOGLE_CONFIG.webClientId,
      offlineAccess: true,
    });

    // 세션 확인
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await checkUserRoleAndNavigate(session.user.id);
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setInitializing(false);
    }
  };

  const checkUserRoleAndNavigate = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (userData?.role === "admin" || userData?.role === "super") {
        navigation.replace("Admin");
      } else {
        navigation.replace("Dashboard");
      }
    } catch (error) {
      console.error("Role check error:", error);
      navigation.replace("Dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Google Sign-In 시작
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("Google 로그인에 실패했습니다.");
      }

      // Supabase에 Google ID 토큰으로 로그인 (nonce 없이)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) throw error;

      if (data.user) {
        await checkUserRoleAndNavigate(data.user.id);
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === "SIGN_IN_CANCELLED") {
        Alert.alert("알림", "로그인이 취소되었습니다.");
      } else {
        Alert.alert(
          "로그인 실패",
          error.message || "구글 로그인에 실패했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            {/* 로고 이미지 - assets/logo.jpg 파일을 추가해주세요 */}
            <Image
              source={require("../../assets/logo.jpg")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>고기당</Text>
          <Text style={styles.subtitle}>프리미엄 숙성삼겹</Text>
          <Text style={styles.description}>직원 근무 관리 시스템</Text>
        </View>

        {/* 구글 로그인 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            로그인하면 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게
            됩니다
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d0a0a", // 로고의 다크 브라운 배경색
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d0a0a",
  },
  loadingText: {
    marginTop: 10,
    color: "#d4af37", // 골드 컬러
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 30,
    paddingTop: 80,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoWrapper: {
    marginBottom: 30,
    alignItems: "center",
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#d4af37", // 골드 컬러
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#d4af37",
    marginBottom: 20,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: "rgba(212, 175, 55, 0.7)",
    marginTop: 10,
  },
  buttonContainer: {
    width: "100%",
  },
  googleButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerText: {
    color: "rgba(212, 175, 55, 0.6)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
