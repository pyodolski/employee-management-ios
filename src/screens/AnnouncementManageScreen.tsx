import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { supabase } from "../config/supabase";
import { format } from "date-fns";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Props {
  onBack: () => void;
  onUpdate: () => void;
}

export default function AnnouncementManageScreen({ onBack, onUpdate }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(
          `
          *,
          profiles (
            full_name
          )
        `
        )
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      fetchAnnouncements();
      onUpdate();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("공지사항 삭제", "정말로 이 공지사항을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("announcements")
              .delete()
              .eq("id", id);

            if (error) throw error;
            fetchAnnouncements();
            onUpdate();
          } catch (error: any) {
            Alert.alert("오류", error.message);
          }
        },
      },
    ]);
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 3:
        return "긴급";
      case 2:
        return "중요";
      default:
        return "일반";
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return { bg: "#fee2e2", text: "#991b1b" };
      case 2:
        return { bg: "#fed7aa", text: "#9a3412" };
      default:
        return { bg: "#dbeafe", text: "#1e40af" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공지사항 관리</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingAnnouncement(null);
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ 작성</Text>
        </TouchableOpacity>
      </View>

      {/* 공지사항 목록 */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다</Text>
          </View>
        ) : (
          announcements.map((announcement) => {
            const priorityColor = getPriorityColor(announcement.priority);
            return (
              <View
                key={announcement.id}
                style={[
                  styles.card,
                  !announcement.is_active && styles.inactiveCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityColor.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: priorityColor.text },
                        ]}
                      >
                        {getPriorityText(announcement.priority)}
                      </Text>
                    </View>
                    {!announcement.is_active && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>비활성</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingAnnouncement(announcement);
                        setShowModal(true);
                      }}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleToggleActive(
                          announcement.id,
                          announcement.is_active
                        )
                      }
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>
                        {announcement.is_active ? "👁️" : "🚫"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(announcement.id)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{announcement.title}</Text>
                <Text style={styles.cardContent} numberOfLines={2}>
                  {announcement.content}
                </Text>
                <Text style={styles.cardDate}>
                  {format(
                    new Date(announcement.created_at),
                    "yyyy-MM-dd HH:mm"
                  )}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 공지 작성/수정 모달 */}
      {showModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => {
            setShowModal(false);
            setEditingAnnouncement(null);
          }}
          onSave={() => {
            fetchAnnouncements();
            setShowModal(false);
            setEditingAnnouncement(null);
            onUpdate();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// 공지 작성/수정 모달
function AnnouncementModal({
  announcement,
  onClose,
  onSave,
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [priority, setPriority] = useState(announcement?.priority || 1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("오류", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        priority,
        author_id: user.id,
      };

      let result;
      if (announcement) {
        result = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", announcement.id);
      } else {
        result = await supabase.from("announcements").insert(announcementData);
      }

      if (result.error) throw result.error;

      Alert.alert("성공", announcement ? "수정되었습니다." : "작성되었습니다.");
      onSave();
    } catch (error: any) {
      Alert.alert("오류", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {announcement ? "공지사항 수정" : "새 공지사항 작성"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.field}>
            <Text style={styles.label}>우선순위</Text>
            <View style={styles.priorityButtons}>
              {[
                { value: 1, label: "일반" },
                { value: 2, label: "중요" },
                { value: 3, label: "긴급" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.priorityButton,
                    priority === item.value && styles.priorityButtonActive,
                  ]}
                  onPress={() => setPriority(item.value)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === item.value &&
                        styles.priorityButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="공지사항 제목을 입력하세요"
              maxLength={200}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>내용 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="공지사항 내용을 입력하세요"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

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
                {loading ? "저장 중..." : announcement ? "수정" : "작성"}
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveCard: {
    backgroundColor: "#f9fafb",
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  inactiveBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonText: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    fontSize: 24,
    color: "#6b7280",
  },
  modalContent: {
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
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  priorityButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  priorityButtonTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
  },
  textArea: {
    minHeight: 150,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
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
