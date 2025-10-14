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
} from "react-native";
import { supabase } from "../config/supabase";
import { WorkLog } from "../types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import WorkRegisterScreen from "./WorkRegisterScreen";

export default function DashboardScreen() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    totalPay: 0,
    approvedHours: 0,
    pendingHours: 0,
  });

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 이번 달 근무 기록 가져오기
      const startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("work_logs")
        .select("*")
        .eq("employee_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;

      setWorkLogs(data || []);
      calculateMonthlyStats(data || []);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMonthlyStats = (logs: WorkLog[]) => {
    const approved = logs.filter((log) => log.status === "approved");
    const pending = logs.filter((log) => log.status === "pending");

    const approvedHours = approved.reduce(
      (sum, log) => sum + (log.total_hours || 0),
      0
    );
    const pendingHours = pending.reduce(
      (sum, log) => sum + (log.total_hours || 0),
      0
    );
    const totalHours = approvedHours + pendingHours;

    // 시급 가져오기 (임시로 10000원 설정, 실제로는 DB에서 가져와야 함)
    const hourlyRate = 10000;
    const totalPay = approvedHours * hourlyRate;

    setMonthlyStats({
      totalHours,
      totalPay,
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
          await supabase.auth.signOut();
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 이번 달 급여 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>이번 달 급여 요약</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 근무시간</Text>
              <Text style={styles.summaryValue}>
                {monthlyStats.totalHours.toFixed(1)}h
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>예상 급여</Text>
              <Text style={styles.summaryValue}>
                ₩{monthlyStats.totalPay.toLocaleString()}
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

        {/* 최근 근무 기록 */}
        <Text style={styles.sectionTitle}>최근 근무 기록</Text>

        {loading ? (
          <Text style={styles.loadingText}>로딩 중...</Text>
        ) : workLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>근무 기록이 없습니다.</Text>
            <Text style={styles.emptySubText}>
              위의 버튼을 눌러 근무를 등록하세요.
            </Text>
          </View>
        ) : (
          workLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logDate}>{log.date}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(log.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(log.status) },
                    ]}
                  >
                    {getStatusText(log.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.logBody}>
                <Text style={styles.logTime}>
                  {log.start_time} - {log.end_time}
                </Text>
                <Text style={styles.logHours}>
                  총 {log.total_hours?.toFixed(1)}시간
                  {log.break_minutes ? ` (휴게 ${log.break_minutes}분)` : ""}
                </Text>
                {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
              </View>
            </View>
          ))
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 15,
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
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
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
