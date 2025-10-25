import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { supabase } from "../config/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { calculateWorkHours, isNightShift } from "../utils/timeUtils";
import WorkLogModal from "../components/WorkLogModal";
import DeductionModal from "../components/DeductionModal";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  hourly_wage: number;
}

interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  work_type?: string;
  created_at: string;
}

interface Deduction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: "fixed" | "percentage";
  is_active: boolean;
}

interface Props {
  employee: Employee;
  onBack: () => void;
  onUpdate?: () => void;
}

export default function EmployeeDetailScreen({
  employee,
  onBack,
  onUpdate,
}: Props) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const startDate = format(
        startOfMonth(new Date(selectedMonth + "-01")),
        "yyyy-MM-dd"
      );
      const endDate = format(
        endOfMonth(new Date(selectedMonth + "-01")),
        "yyyy-MM-dd"
      );

      // 근무 기록 조회
      const { data: logs, error: logsError } = await supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", employee.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (logsError) throw logsError;

      // 공제 항목 조회
      const { data: deductionData, error: deductionError } = await supabase
        .from("salary_deductions")
        .select("*")
        .eq("user_id", employee.id);

      if (deductionError) throw deductionError;

      setWorkLogs(logs || []);
      setDeductions(deductionData || []);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteWorkLog = async (logId: string) => {
    Alert.alert("근무 기록 삭제", "이 근무 기록을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("work_logs")
              .delete()
              .eq("id", logId);

            if (error) throw error;

            Alert.alert("성공", "근무 기록이 삭제되었습니다.");
            fetchData();
            onUpdate?.();
          } catch (error: any) {
            Alert.alert("오류", error.message);
          }
        },
      },
    ]);
  };

  const handleToggleDeduction = async (deduction: Deduction) => {
    try {
      const { error } = await supabase
        .from("salary_deductions")
        .update({ is_active: !deduction.is_active })
        .eq("id", deduction.id);

      if (error) throw error;

      fetchData();
      onUpdate?.();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const handleDeleteDeduction = async (deductionId: string) => {
    Alert.alert("공제 항목 삭제", "이 공제 항목을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("salary_deductions")
              .delete()
              .eq("id", deductionId);

            if (error) throw error;

            Alert.alert("성공", "공제 항목이 삭제되었습니다.");
            fetchData();
            onUpdate?.();
          } catch (error: any) {
            Alert.alert("오류", error.message);
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // 급여 계산
  const approvedLogs = workLogs.filter((log) => log.status === "approved");
  const totalHours = approvedLogs.reduce((sum, log) => {
    return sum + calculateWorkHours(log.clock_in, log.clock_out, log.work_type);
  }, 0);
  const grossPay = Math.floor(totalHours * employee.hourly_wage);

  // 활성화된 공제 항목
  const activeDeductions = deductions.filter((d) => d.is_active);
  const totalDeductions = activeDeductions.reduce((sum, d) => {
    const amount =
      d.type === "fixed" ? d.amount : Math.floor((grossPay * d.amount) / 100);
    return sum + amount;
  }, 0);

  const netPay = Math.floor(grossPay - totalDeductions);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{employee.full_name}</Text>
          <Text style={styles.headerEmail}>{employee.email}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
          <Text style={styles.sectionTitle}>급여 요약</Text>

          <View style={styles.mainPayBox}>
            <Text style={styles.mainPayLabel}>실지급액</Text>
            <Text style={styles.mainPayValue}>₩{netPay.toLocaleString()}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>근무시간</Text>
              <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>시급</Text>
              <Text style={styles.statValue}>
                ₩{employee.hourly_wage.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총급여</Text>
              <Text style={styles.statValue}>₩{grossPay.toLocaleString()}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총공제</Text>
              <Text style={[styles.statValue, styles.deductionText]}>
                ₩{totalDeductions.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 근무 기록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>근무 기록</Text>
              <Text style={styles.sectionSubtitle}>
                총 {workLogs.length}건 (승인: {approvedLogs.length}건)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowWorkLogModal(true)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ 근무추가</Text>
            </TouchableOpacity>
          </View>

          {workLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>근무 기록이 없습니다</Text>
            </View>
          ) : (
            workLogs.map((log) => {
              const hours = calculateWorkHours(
                log.clock_in,
                log.clock_out,
                log.work_type
              );
              const dailyPay = Math.floor(hours * employee.hourly_wage);
              const isOffDay = log.work_type === "day_off";
              const isNight = isNightShift(log.clock_in, log.clock_out);

              return (
                <View
                  key={log.id}
                  style={[styles.logCard, isOffDay && styles.offDayCard]}
                >
                  <View style={styles.logHeader}>
                    <View style={styles.logDateContainer}>
                      <Text style={styles.logDate}>
                        {format(new Date(log.date), "MM/dd")}
                      </Text>
                      {isOffDay && (
                        <View style={styles.offDayBadge}>
                          <Text style={styles.offDayBadgeText}>휴무</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusBadge,
                          log.status === "approved" && styles.approvedBadge,
                          log.status === "rejected" && styles.rejectedBadge,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {log.status === "approved"
                            ? "승인"
                            : log.status === "rejected"
                            ? "반려"
                            : "대기"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteWorkLog(log.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.logBody}>
                    {isOffDay ? (
                      <Text style={styles.logTime}>휴무일</Text>
                    ) : (
                      <>
                        <Text style={styles.logTime}>
                          {log.clock_in} ~ {log.clock_out}
                          {isNight && (
                            <Text style={styles.nightBadge}> (야간)</Text>
                          )}
                        </Text>
                        <Text style={styles.logHours}>
                          {hours.toFixed(1)}시간
                        </Text>
                      </>
                    )}
                  </View>

                  <Text style={styles.logPay}>
                    {isOffDay ? "-" : `₩${dailyPay.toLocaleString()}`}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 공제 항목 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>공제 항목</Text>
              <Text style={styles.sectionSubtitle}>
                활성 {activeDeductions.length}개 / 전체 {deductions.length}개
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDeductionModal(true)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ 공제추가</Text>
            </TouchableOpacity>
          </View>

          {deductions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>공제 항목이 없습니다</Text>
            </View>
          ) : (
            deductions.map((deduction) => {
              const actualAmount =
                deduction.type === "fixed"
                  ? deduction.amount
                  : Math.floor((grossPay * deduction.amount) / 100);

              return (
                <View key={deduction.id} style={styles.deductionCard}>
                  <View style={styles.deductionInfo}>
                    <Text style={styles.deductionName}>{deduction.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleToggleDeduction(deduction)}
                      style={[
                        styles.activeToggle,
                        deduction.is_active && styles.activeToggleOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeToggleText,
                          deduction.is_active && styles.activeToggleTextOn,
                        ]}
                      >
                        {deduction.is_active ? "활성" : "비활성"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.deductionType}>
                    {deduction.type === "fixed"
                      ? "고정금액"
                      : `비율 (${deduction.amount}%)`}
                  </Text>
                  <View style={styles.deductionFooter}>
                    <Text style={styles.deductionAmount}>
                      ₩{actualAmount.toLocaleString()}
                    </Text>
                    <View style={styles.deductionActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDeduction(deduction);
                          setShowDeductionModal(true);
                        }}
                        style={styles.editButton}
                      >
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDeduction(deduction.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 근무 추가/수정 모달 */}
      <WorkLogModal
        visible={showWorkLogModal}
        employee={employee}
        workLog={selectedWorkLog}
        onClose={() => {
          setShowWorkLogModal(false);
          setSelectedWorkLog(null);
        }}
        onSave={() => {
          fetchData();
          setShowWorkLogModal(false);
          setSelectedWorkLog(null);
          onUpdate?.();
        }}
      />

      {/* 공제 추가/수정 모달 */}
      <DeductionModal
        visible={showDeductionModal}
        employee={employee}
        deduction={selectedDeduction}
        onClose={() => {
          setShowDeductionModal(false);
          setSelectedDeduction(null);
        }}
        onSave={() => {
          fetchData();
          setShowDeductionModal(false);
          setSelectedDeduction(null);
          onUpdate?.();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1E8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: "#374151",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthButton: {
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  monthButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  mainPayBox: {
    backgroundColor: "#3b82f6",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  mainPayLabel: {
    fontSize: 14,
    color: "#bfdbfe",
    marginBottom: 4,
  },
  mainPayValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  deductionText: {
    color: "#ef4444",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  logCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  offDayCard: {
    backgroundColor: "#fef3c7",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  offDayBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  offDayBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#fbbf24",
  },
  approvedBadge: {
    backgroundColor: "#10b981",
  },
  rejectedBadge: {
    backgroundColor: "#ef4444",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  logBody: {
    marginBottom: 8,
  },
  logTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  nightBadge: {
    fontSize: 12,
    color: "#8b5cf6",
  },
  logHours: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  logPay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  deductionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  deductionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  deductionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  activeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  activeToggleOn: {
    backgroundColor: "#10b981",
  },
  activeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeToggleTextOn: {
    color: "#fff",
  },
  deductionType: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  deductionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  deductionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deductionActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
