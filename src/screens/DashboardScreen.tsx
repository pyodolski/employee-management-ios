import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { supabase } from "../config/supabase";
import { WorkLog } from "../types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import WorkRegisterScreen from "./WorkRegisterScreen";
import { calculateWorkHours } from "../utils/timeUtils";
import AnnouncementBanner from "../components/AnnouncementBanner";
import WorkCalendar from "../components/WorkCalendar";

export default function DashboardScreen() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [activeTab, setActiveTab] = useState<
    "summary" | "calendar" | "history"
  >("summary");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    totalPay: 0,
    hourlyWage: 0,
    totalDeductions: 0,
    realPay: 0,
    approvedHours: 0,
    pendingHours: 0,
  });

  useEffect(() => {
    fetchWorkLogs();
  }, [selectedMonth]);

  const fetchWorkLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 선택한 달의 근무 기록 가져오기
      const startDate = format(
        startOfMonth(new Date(selectedMonth + "-01")),
        "yyyy-MM-dd"
      );
      const endDate = format(
        endOfMonth(new Date(selectedMonth + "-01")),
        "yyyy-MM-dd"
      );

      const { data, error } = await supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;

      setWorkLogs(data || []);
      await calculateMonthlyStats(data || [], user.id);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMonthlyStats = async (logs: WorkLog[], userId: string) => {
    const approved = logs.filter((log) => log.status === "approved");
    const pending = logs.filter((log) => log.status === "pending");

    const approvedHours = approved.reduce(
      (sum, log) =>
        sum + calculateWorkHours(log.clock_in, log.clock_out, log.work_type),
      0
    );
    const pendingHours = pending.reduce(
      (sum, log) =>
        sum + calculateWorkHours(log.clock_in, log.clock_out, log.work_type),
      0
    );
    const totalHours = approvedHours + pendingHours;

    // 시급 가져오기
    const { data: profile } = await supabase
      .from("profiles")
      .select("hourly_wage")
      .eq("id", userId)
      .single();

    const hourlyWage = profile?.hourly_wage || 10030;
    const totalPay = Math.floor(approvedHours * hourlyWage);

    // 공제 항목 가져오기
    const { data: deductions } = await supabase
      .from("salary_deductions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    // 총 공제 계산
    let totalDeductions = 0;
    if (deductions && deductions.length > 0) {
      deductions.forEach((deduction: any) => {
        const amount =
          deduction.type === "fixed"
            ? deduction.amount
            : Math.floor((totalPay * deduction.amount) / 100);
        totalDeductions += amount;
      });
    }

    const realPay = Math.floor(totalPay - totalDeductions);

    setMonthlyStats({
      totalHours,
      totalPay,
      hourlyWage,
      totalDeductions,
      realPay,
      approvedHours,
      pendingHours,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkLogs();
  };

  const handleLogout = async () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          } catch (error: any) {
            Alert.alert(
              "오류",
              "로그아웃 중 오류가 발생했습니다: " + error.message
            );
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      default:
        return "대기중";
    }
  };

  // 필터링된 근무 기록
  const filteredWorkLogs =
    statusFilter === "all"
      ? workLogs
      : workLogs.filter((log) => log.status === statusFilter);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 공지사항 배너 */}
        <AnnouncementBanner />

        {/* 월 선택 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => {
              const date = new Date(selectedMonth + "-01");
              date.setMonth(date.getMonth() - 1);
              setSelectedMonth(format(date, "yyyy-MM"));
            }}
            style={styles.monthButton}
          >
            <Text style={styles.monthButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(new Date(selectedMonth + "-01"), "yyyy년 MM월")}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const date = new Date(selectedMonth + "-01");
              date.setMonth(date.getMonth() + 1);
              setSelectedMonth(format(date, "yyyy-MM"));
            }}
            style={styles.monthButton}
          >
            <Text style={styles.monthButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 급여 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>급여 요약</Text>

          {/* 실지급액 - 메인 표시 */}
          <View style={styles.mainPayBox}>
            <Text style={styles.mainPayLabel}>실지급액</Text>
            <Text style={styles.mainPayValue}>
              ₩{monthlyStats.realPay.toLocaleString()}
            </Text>
          </View>

          {/* 상세 정보 그리드 */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총 근무시간</Text>
              <Text style={styles.statValue}>
                {monthlyStats.totalHours.toFixed(1)}h
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>시급</Text>
              <Text style={styles.statValue}>
                ₩{monthlyStats.hourlyWage.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총 급여</Text>
              <Text style={styles.statValue}>
                ₩{monthlyStats.totalPay.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총 공제</Text>
              <Text style={[styles.statValue, styles.deductionText]}>
                ₩{monthlyStats.totalDeductions.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDetail}>
            <Text style={styles.summaryDetailText}>
              승인: {monthlyStats.approvedHours.toFixed(1)}h | 대기:{" "}
              {monthlyStats.pendingHours.toFixed(1)}h
            </Text>
          </View>
        </View>

        {/* 근무 등록 버튼 */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => setShowRegisterModal(true)}
        >
          <Text style={styles.registerButtonText}>+ 근무 등록</Text>
        </TouchableOpacity>

        {/* 탭 네비게이션 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "summary" && styles.activeTab]}
            onPress={() => setActiveTab("summary")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "summary" && styles.activeTabText,
              ]}
            >
              📊 급여 요약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "calendar" && styles.activeTab]}
            onPress={() => setActiveTab("calendar")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "calendar" && styles.activeTabText,
              ]}
            >
              📅 근무 캘린더
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.activeTab]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.activeTabText,
              ]}
            >
              📋 근무 내역
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {activeTab === "summary" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentText}>
              위의 급여 요약 카드에서 이번 달 급여 정보를 확인하세요.
            </Text>
          </View>
        )}

        {activeTab === "calendar" && (
          <WorkCalendar selectedMonth={selectedMonth} />
        )}

        {activeTab === "history" && (
          <>
            {/* 필터 버튼 */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  전체
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === "pending" && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter("pending")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === "pending" && styles.filterButtonTextActive,
                  ]}
                >
                  대기중
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === "approved" && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter("approved")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === "approved" &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  승인됨
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === "rejected" && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter("rejected")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === "rejected" &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  거부됨
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
              근무 내역 ({filteredWorkLogs.length}건)
            </Text>
            {loading ? (
              <Text style={styles.loadingText}>로딩 중...</Text>
            ) : filteredWorkLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>근무 기록이 없습니다.</Text>
                <Text style={styles.emptySubText}>
                  위의 버튼을 눌러 근무를 등록하세요.
                </Text>
              </View>
            ) : (
              filteredWorkLogs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logDateContainer}>
                      <Text style={styles.logDate}>
                        {format(new Date(log.date), "MM월 dd일")}
                      </Text>
                      {log.work_type === "day_off" && (
                        <View style={styles.dayOffBadge}>
                          <Text style={styles.dayOffBadgeText}>휴무</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(log.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {getStatusText(log.status)}
                      </Text>
                    </View>
                  </View>

                  {log.work_type === "day_off" ? (
                    <View style={styles.logBody}>
                      <Text style={styles.logTime}>휴무일</Text>
                      {log.day_off_reason && (
                        <Text style={styles.logReason}>
                          사유: {log.day_off_reason}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.logBody}>
                      <Text style={styles.logTime}>
                        {log.clock_in} - {log.clock_out}
                      </Text>
                      <Text style={styles.logHours}>
                        총{" "}
                        {calculateWorkHours(
                          log.clock_in,
                          log.clock_out,
                          log.work_type
                        ).toFixed(1)}
                        시간
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      {/* 근무 등록 모달 */}
      <Modal
        visible={showRegisterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WorkRegisterScreen
          onClose={() => setShowRegisterModal(false)}
          onSuccess={fetchWorkLogs}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1E8",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthButton: {
    padding: 8,
    backgroundColor: "#F5F1E8",
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  monthButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8B4513",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  mainPayBox: {
    backgroundColor: "#8B4513",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  mainPayLabel: {
    fontSize: 14,
    color: "#E0D5C7",
    marginBottom: 4,
  },
  mainPayValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F5F1E8",
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B5D52",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
  },
  deductionText: {
    color: "#8B2500",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F5F1E8",
  },
  activeTab: {
    backgroundColor: "#8B4513",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B5D52",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    alignItems: "center",
  },
  tabContentText: {
    fontSize: 14,
    color: "#6B5D52",
    textAlign: "center",
    lineHeight: 20,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B5D52",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  logDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayOffBadge: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dayOffBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  logReason: {
    fontSize: 12,
    color: "#6B5D52",
    marginTop: 4,
    fontStyle: "italic",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  summaryDetail: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  summaryDetailText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  registerButton: {
    backgroundColor: "#8B4513",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
  },
  logCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  logBody: {
    gap: 5,
  },
  logTime: {
    fontSize: 14,
    color: "#666",
  },
  logHours: {
    fontSize: 14,
    color: "#666",
  },
  logNotes: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 15,
    margin: 20,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
