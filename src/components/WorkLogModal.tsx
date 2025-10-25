import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { supabase } from "../config/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { calculateWorkHours } from "../utils/timeUtils";

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

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
  visible: boolean;
  employee: Employee;
  workLog?: WorkLog | null;
  onClose: () => void;
  onSave: () => void;
}

export default function WorkLogModal({
  visible,
  employee,
  workLog,
  onClose,
  onSave,
}: Props) {
  const [date, setDate] = useState(
    workLog?.date ? new Date(workLog.date) : new Date()
  );
  const [workType, setWorkType] = useState(workLog?.work_type || "work");
  const [clockIn, setClockIn] = useState(() => {
    if (workLog?.clock_in) {
      const [h, m] = workLog.clock_in.split(":");
      const d = new Date();
      d.setHours(parseInt(h), parseInt(m));
      return d;
    }
    const d = new Date();
    d.setHours(9, 0);
    return d;
  });
  const [clockOut, setClockOut] = useState(() => {
    if (workLog?.clock_out) {
      const [h, m] = workLog.clock_out.split(":");
      const d = new Date();
      d.setHours(parseInt(h), parseInt(m));
      return d;
    }
    const d = new Date();
    d.setHours(18, 0);
    return d;
  });
  const [dayOffReason, setDayOffReason] = useState(
    workLog?.day_off_reason || ""
  );
  const [status, setStatus] = useState(workLog?.status || "approved");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // 중복 검증 (추가인 경우에만)
      if (!workLog) {
        const { data: existingLog, error: checkError } = await supabase
          .from("work_logs")
          .select("id, work_type")
          .eq("user_id", employee.id)
          .eq("date", dateStr)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw new Error("기록 확인 중 오류가 발생했습니다");
        }

        if (existingLog) {
          const existingType =
            existingLog.work_type === "day_off" ? "휴무" : "근무";
          Alert.alert(
            "오류",
            `${dateStr}에 이미 ${existingType} 기록이 존재합니다.`
          );
          setLoading(false);
          return;
        }
      }

      const workData: any = {
        user_id: employee.id,
        date: dateStr,
        work_type: workType,
        status,
      };

      if (workType !== "day_off") {
        workData.clock_in = format(clockIn, "HH:mm:ss");
        workData.clock_out = format(clockOut, "HH:mm:ss");
        workData.day_off_reason = null;
      } else {
        workData.clock_in = null;
        workData.clock_out = null;
        workData.day_off_reason = dayOffReason.trim() || "사유 미입력";
      }

      let result;
      if (workLog) {
        result = await supabase
          .from("work_logs")
          .update(workData)
          .eq("id", workLog.id);
      } else {
        result = await supabase.from("work_logs").insert(workData);
      }

      if (result.error) {
        if (result.error.code === "23505") {
          Alert.alert("오류", "이미 해당 날짜에 근무 기록이 존재합니다.");
        } else {
          throw result.error;
        }
      } else {
        Alert.alert(
          "성공",
          workLog
            ? "근무 기록이 수정되었습니다."
            : "근무 기록이 추가되었습니다."
        );
        onSave();
      }
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getWorkHoursDisplay = () => {
    if (workType === "day_off") return "휴무";

    const hours = calculateWorkHours(
      format(clockIn, "HH:mm"),
      format(clockOut, "HH:mm"),
      workType
    );
    return `${hours.toFixed(1)}시간`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {workLog ? "근무 기록 수정" : "근무 기록 추가"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employee.full_name}</Text>
            <Text style={styles.employeeEmail}>{employee.email}</Text>
          </View>

          {/* 날짜 */}
          <View style={styles.field}>
            <Text style={styles.label}>날짜</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{format(date, "yyyy년 MM월 dd일")}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* 유형 */}
          <View style={styles.field}>
            <Text style={styles.label}>유형</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  workType === "work" && styles.typeButtonActive,
                ]}
                onPress={() => setWorkType("work")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    workType === "work" && styles.typeButtonTextActive,
                  ]}
                >
                  근무
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  workType === "day_off" && styles.typeButtonActive,
                ]}
                onPress={() => setWorkType("day_off")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    workType === "day_off" && styles.typeButtonTextActive,
                  ]}
                >
                  휴무
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 근무 시간 */}
          {workType === "work" && (
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>출근시간</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowClockInPicker(true)}
                >
                  <Text>{format(clockIn, "HH:mm")}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeField}>
                <Text style={styles.label}>퇴근시간</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowClockOutPicker(true)}
                >
                  <Text>{format(clockOut, "HH:mm")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showClockInPicker && (
            <DateTimePicker
              value={clockIn}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowClockInPicker(Platform.OS === "ios");
                if (selectedTime) setClockIn(selectedTime);
              }}
            />
          )}

          {showClockOutPicker && (
            <DateTimePicker
              value={clockOut}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowClockOutPicker(Platform.OS === "ios");
                if (selectedTime) setClockOut(selectedTime);
              }}
            />
          )}

          {/* 휴무 사유 */}
          {workType === "day_off" && (
            <View style={styles.field}>
              <Text style={styles.label}>휴무 사유</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={dayOffReason}
                onChangeText={setDayOffReason}
                placeholder="휴무 사유를 입력해주세요"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{dayOffReason.length}/200자</Text>
            </View>
          )}

          {/* 상태 */}
          <View style={styles.field}>
            <Text style={styles.label}>상태</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "pending" && styles.statusButtonPending,
                ]}
                onPress={() => setStatus("pending")}
              >
                <Text style={styles.statusButtonText}>대기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "approved" && styles.statusButtonApproved,
                ]}
                onPress={() => setStatus("approved")}
              >
                <Text style={styles.statusButtonText}>승인</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "rejected" && styles.statusButtonRejected,
                ]}
                onPress={() => setStatus("rejected")}
              >
                <Text style={styles.statusButtonText}>거절</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 요약 */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>
              {workType === "work" ? "예상 근무시간" : "유형"}
            </Text>
            <Text style={styles.summaryValue}>{getWorkHoursDisplay()}</Text>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "저장 중..." : workLog ? "수정" : "추가"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  employeeInfo: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
  },
  employeeEmail: {
    fontSize: 14,
    color: "#3b82f6",
    marginTop: 2,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "right",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statusButtonPending: {
    backgroundColor: "#fbbf24",
    borderColor: "#fbbf24",
  },
  statusButtonApproved: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  statusButtonRejected: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  summary: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
