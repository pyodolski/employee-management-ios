import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../config/supabase";
import { Employee, WorkLog } from "../types";

export default function AdminScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingLogs, setPendingLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, logsRes] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("work_logs").select("*").eq("status", "pending"),
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (logsRes.error) throw logsRes.error;

      setEmployees(employeesRes.data || []);
      setPendingLogs(logsRes.data || []);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (logId: string) => {
    try {
      const { error } = await supabase
        .from("work_logs")
        .update({ status: "approved" })
        .eq("id", logId);

      if (error) throw error;
      Alert.alert("성공", "근무 기록이 승인되었습니다.");
      fetchData();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>직원 목록 ({employees.length}명)</Text>
        {employees.map((emp) => (
          <View key={emp.id} style={styles.card}>
            <Text style={styles.empName}>{emp.name}</Text>
            <Text style={styles.empInfo}>{emp.email}</Text>
            <Text style={styles.empInfo}>{emp.position || "직책 없음"}</Text>
          </View>
        ))}

        <Text style={styles.title}>승인 대기 ({pendingLogs.length}건)</Text>
        {pendingLogs.map((log) => (
          <View key={log.id} style={styles.card}>
            <Text style={styles.logDate}>{log.date}</Text>
            <Text style={styles.logTime}>
              {log.start_time} - {log.end_time}
            </Text>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(log.id)}
            >
              <Text style={styles.approveText}>승인</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  empName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  empInfo: {
    fontSize: 14,
    color: "#666",
  },
  logDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  logTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  approveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#F44336",
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
