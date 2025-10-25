import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../config/supabase";
import { format } from "date-fns";
import { calculateWorkHours } from "../utils/timeUtils";

interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  work_type?: string;
  day_off_reason?: string;
}

interface Props {
  selectedMonth: string; // "yyyy-MM" 형식
}

export default function WorkCalendar({ selectedMonth }: Props) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkLogs();
  }, [selectedMonth]);

  const fetchWorkLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = format(new Date(selectedMonth + "-01"), "yyyy-MM-01");
      const endDate = format(
        new Date(
          new Date(selectedMonth + "-01").getFullYear(),
          new Date(selectedMonth + "-01").getMonth() + 1,
          0
        ),
        "yyyy-MM-dd"
      );

      const { data, error } = await supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      setWorkLogs(data || []);
      processMarkedDates(data || []);
    } catch (error) {
      console.error("Error fetching work logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMarkedDates = (logs: WorkLog[]) => {
    const marked: any = {};

    logs.forEach((log) => {
      let color = "#f59e0b"; // 대기중 - 주황색
      let textColor = "#fff";

      if (log.status === "approved") {
        color = "#10b981"; // 승인 - 초록색
      } else if (log.status === "rejected") {
        color = "#ef4444"; // 거부 - 빨간색
      }

      if (log.work_type === "day_off") {
        color = "#6b7280"; // 휴무 - 회색
      }

      marked[log.date] = {
        selected: true,
        selectedColor: color,
        selectedTextColor: textColor,
      };
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day: any) => {
    const log = workLogs.find((l) => l.date === day.dateString);
    if (log) {
      setSelectedDate(day.dateString);
      setSelectedLog(log);
      setShowDetailModal(true);
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

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedMonth + "-01"}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#8B4513",
          selectedDayBackgroundColor: "#8B4513",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#D4AF37",
          dayTextColor: "#2d0a0a",
          textDisabledColor: "#d9e1e8",
          monthTextColor: "#8B4513",
          textMonthFontWeight: "bold",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>승인</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={styles.legendText}>대기</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>거부</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#6b7280" }]} />
          <Text style={styles.legendText}>휴무</Text>
        </View>
      </View>

      {/* 상세 정보 모달 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>근무 상세 정보</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedLog && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>날짜</Text>
                  <Text style={styles.detailValue}>
                    {format(new Date(selectedLog.date), "yyyy년 MM월 dd일")}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>상태</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedLog.status) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(selectedLog.status)}
                    </Text>
                  </View>
                </View>

                {selectedLog.work_type === "day_off" ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>유형</Text>
                      <Text style={styles.detailValue}>휴무</Text>
                    </View>
                    {selectedLog.day_off_reason && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>사유</Text>
                        <Text style={styles.detailValue}>
                          {selectedLog.day_off_reason}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>출근 시간</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.clock_in || "-"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>퇴근 시간</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.clock_out || "-"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>근무 시간</Text>
                      <Text style={styles.detailValue}>
                        {calculateWorkHours(
                          selectedLog.clock_in,
                          selectedLog.clock_out,
                          selectedLog.work_type
                        ).toFixed(1)}
                        시간
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0D5C7",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0D5C7",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6B5D52",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0D5C7",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
  },
  closeButton: {
    fontSize: 24,
    color: "#6B5D52",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: "#F5F1E8",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0D5C7",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B5D52",
  },
  detailValue: {
    fontSize: 14,
    color: "#8B4513",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
