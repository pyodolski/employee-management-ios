import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { supabase } from "../config/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkRegisterScreen({ onClose, onSuccess }: Props) {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const calculateTotalHours = () => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    const breakHours = parseInt(breakMinutes || "0") / 60;
    return Math.max(0, hours - breakHours);
  };

  const handleSubmit = async () => {
    const totalHours = calculateTotalHours();

    if (totalHours <= 0) {
      Alert.alert("오류", "근무 시간을 확인해주세요.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { error } = await supabase.from("work_logs").insert({
        employee_id: user.id,
        date: format(date, "yyyy-MM-dd"),
        start_time: format(startTime, "HH:mm"),
        end_time: format(endTime, "HH:mm"),
        break_minutes: parseInt(breakMinutes || "0"),
        total_hours: totalHours,
        status: "pending",
        notes: notes || null,
      });

      if (error) throw error;

      Alert.alert("성공", "근무 기록이 등록되었습니다.");
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>근무 등록</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 날짜 선택 */}
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

        {/* 시작 시간 */}
        <View style={styles.field}>
          <Text style={styles.label}>시작 시간</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text>{format(startTime, "HH:mm")}</Text>
          </TouchableOpacity>
        </View>

        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowStartTimePicker(Platform.OS === "ios");
              if (selectedTime) setStartTime(selectedTime);
            }}
          />
        )}

        {/* 종료 시간 */}
        <View style={styles.field}>
          <Text style={styles.label}>종료 시간</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text>{format(endTime, "HH:mm")}</Text>
          </TouchableOpacity>
        </View>

        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(Platform.OS === "ios");
              if (selectedTime) setEndTime(selectedTime);
            }}
          />
        )}

        {/* 휴게 시간 */}
        <View style={styles.field}>
          <Text style={styles.label}>휴게 시간 (분)</Text>
          <TextInput
            style={styles.input}
            value={breakMinutes}
            onChangeText={setBreakMinutes}
            keyboardType="number-pad"
            placeholder="60"
          />
        </View>

        {/* 메모 */}
        <View style={styles.field}>
          <Text style={styles.label}>메모 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="특이사항을 입력하세요"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 총 근무 시간 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>총 근무 시간</Text>
          <Text style={styles.summaryValue}>
            {calculateTotalHours().toFixed(1)} 시간
          </Text>
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
              {loading ? "등록 중..." : "등록"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  summaryCard: {
    backgroundColor: "#eff6ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#1e40af",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e40af",
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
