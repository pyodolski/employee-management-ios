import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../config/supabase";
import { format } from "date-fns";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Props {
  isAdmin?: boolean;
  onManagePress?: () => void;
  refreshTrigger?: number;
}

export default function AnnouncementBanner({
  isAdmin = false,
  onManagePress,
  refreshTrigger = 0,
}: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [refreshTrigger]);

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
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 3:
        return {
          bg: ["#ef4444", "#dc2626"],
          icon: "🚨",
          text: "긴급 공지",
        };
      case 2:
        return {
          bg: ["#f97316", "#ea580c"],
          icon: "⚠️",
          text: "중요 공지",
        };
      default:
        return {
          bg: ["#3b82f6", "#2563eb"],
          icon: "📢",
          text: "공지사항",
        };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (announcements.length === 0) {
    // 기본 환영 메시지
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isAdmin ? "#8b5cf6" : "#3b82f6" },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{isAdmin ? "👨‍💼" : "👋"}</Text>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              {isAdmin ? "환영합니다, 관리자님!" : "안녕하세요!"}
            </Text>
            <Text style={styles.subtitle}>
              {isAdmin
                ? "직원들의 근무 승인과 급여 관리를 효율적으로 처리하세요"
                : "오늘도 좋은 하루 되세요. 근무 등록을 잊지 마세요!"}
            </Text>
          </View>
          {isAdmin && onManagePress && (
            <TouchableOpacity
              onPress={onManagePress}
              style={styles.manageButton}
            >
              <Text style={styles.manageButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const currentAnnouncement = announcements[currentIndex];
  const config = getPriorityConfig(currentAnnouncement.priority);

  return (
    <View style={[styles.container, { backgroundColor: config.bg[0] }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{config.text}</Text>
            </View>
            {announcements.length > 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {currentIndex + 1} / {announcements.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {currentAnnouncement.title}
          </Text>
        </View>
        {isAdmin && onManagePress && (
          <TouchableOpacity onPress={onManagePress} style={styles.manageButton}>
            <Text style={styles.manageButtonText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.content} numberOfLines={expanded ? undefined : 2}>
        {currentAnnouncement.content}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {format(new Date(currentAnnouncement.created_at), "MM-dd HH:mm")}
        </Text>
        <View style={styles.actions}>
          {currentAnnouncement.content.length > 80 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.actionText}>
                {expanded ? "접기" : "더보기"}
              </Text>
            </TouchableOpacity>
          )}
          {announcements.length > 1 && (
            <View style={styles.navigation}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentIndex(
                    (prev) =>
                      (prev - 1 + announcements.length) % announcements.length
                  )
                }
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setCurrentIndex((prev) => (prev + 1) % announcements.length)
                }
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 22,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  content: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  navigation: {
    flexDirection: "row",
    gap: 6,
  },
  navButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  manageButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  manageButtonText: {
    fontSize: 16,
  },
});
