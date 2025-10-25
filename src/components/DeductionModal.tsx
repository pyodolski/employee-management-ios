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
  Switch,
} from "react-native";
import { supabase } from "../config/supabase";

interface Employee {
  id: string;
  full_name: string;
  email: string;
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
  visible: boolean;
  employee: Employee;
  deduction?: Deduction | null;
  onClose: () => void;
  onSave: () => void;
}

export default function DeductionModal({
  visible,
  employee,
  deduction,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(deduction?.name || "");
  const [amount, setAmount] = useState(deduction?.amount?.toString() || "");
  const [type, setType] = useState<"fixed" | "percentage">(
    deduction?.type || "fixed"
  );
  const [isActive, setIsActive] = useState(deduction?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  // 미리 정의된 공제 항목들
  const presetDeductions = [
    { name: "소득세", type: "percentage" as const, amount: 3 },
    { name: "지방세", type: "percentage" as const, amount: 0.3 },
    { name: "국민연금", type: "percentage" as const, amount: 4.5 },
    { name: "건강보험", type: "percentage" as const, amount: 3.545 },
    { name: "장기요양보험", type: "percentage" as const, amount: 0.4091 },
    { name: "고용보험", type: "percentage" as const, amount: 0.9 },
    { name: "식대", type: "fixed" as const, amount: 100000 },
    { name: "교통비", type: "fixed" as const, amount: 50000 },
  ];

  const handlePresetSelect = (preset: (typeof presetDeductions)[0]) => {
    setName(preset.name);
    setType(preset.type);
    setAmount(preset.amount.toString());
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("오류", "항목명을 입력해주세요.");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      Alert.alert("오류", "올바른 금액을 입력해주세요.");
      return;
    }

    if (type === "percentage" && amountNum > 100) {
      Alert.alert("오류", "비율은 100%를 초과할 수 없습니다.");
      return;
    }

    setLoading(true);

    try {
      const deductionData = {
        user_id: employee.id,
        name: name.trim(),
        amount: amountNum,
        type,
        is_active: isActive,
      };

      let result;
      if (deduction) {
        result = await supabase
          .from("salary_deductions")
          .update(deductionData)
          .eq("id", deduction.id);
      } else {
        result = await supabase.from("salary_deductions").insert(deductionData);
      }

      if (result.error) {
        throw result.error;
      }

      Alert.alert(
        "성공",
        deduction
          ? "공제 항목이 수정되었습니다."
          : "공제 항목이 추가되었습니다."
      );
      onSave();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
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
            {deduction ? "공제 항목 수정" : "공제 항목 추가"}
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

          {/* 빠른 선택 */}
          {!deduction && (
            <View style={styles.field}>
              <Text style={styles.label}>빠른 선택</Text>
              <View style={styles.presetGrid}>
                {presetDeductions.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetButton}
                    onPress={() => handlePresetSelect(preset)}
                  >
                    <Text style={styles.presetName}>{preset.name}</Text>
                    <Text style={styles.presetAmount}>
                      {preset.type === "fixed"
                        ? `${preset.amount.toLocaleString()}원`
                        : `${preset.amount}%`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 항목명 */}
          <View style={styles.field}>
            <Text style={styles.label}>항목명</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 국민연금, 건강보험, 식대 등"
            />
          </View>

          {/* 공제 유형 */}
          <View style={styles.field}>
            <Text style={styles.label}>공제 유형</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === "fixed" && styles.typeButtonActive,
                ]}
                onPress={() => setType("fixed")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "fixed" && styles.typeButtonTextActive,
                  ]}
                >
                  고정 금액
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === "percentage" && styles.typeButtonActive,
                ]}
                onPress={() => setType("percentage")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "percentage" && styles.typeButtonTextActive,
                  ]}
                >
                  비율 (%)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 금액/비율 */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {type === "fixed" ? "공제 금액 (원)" : "공제 비율 (%)"}
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={type === "fixed" ? "100000" : "4.5"}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              {type === "fixed"
                ? "매월 고정으로 공제될 금액을 입력하세요"
                : "급여에서 공제될 비율을 입력하세요 (예: 4.5% → 4.5 입력)"}
            </Text>
          </View>

          {/* 활성화 */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              활성화 (체크 해제 시 공제되지 않음)
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={isActive ? "#3b82f6" : "#f3f4f6"}
            />
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
                {loading ? "저장 중..." : deduction ? "수정" : "추가"}
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
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    width: "48%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  presetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  presetAmount: {
    fontSize: 12,
    color: "#6b7280",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
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
