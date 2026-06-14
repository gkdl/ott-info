import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSignOut, useDeleteAccount } from "@/hooks/useAuth";

interface MenuItemProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
  variant?: "default" | "danger";
  icon?: string;
}

function MenuItem({ label, sublabel, onPress, variant = "default", icon }: MenuItemProps) {
  return (
    <Pressable
      style={styles.menuItem}
      android_ripple={{ color: "#1f2937" }}
      onPress={onPress}
    >
      {icon && <Text style={styles.menuIcon}>{icon}</Text>}
      <View style={styles.menuTexts}>
        <Text
          style={[
            styles.menuLabel,
            variant === "danger" && styles.menuLabelDanger,
          ]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={styles.menuSublabel}>{sublabel}</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function AccountActions() {
  const router = useRouter();
  const { confirmSignOut, isPending: isSignOutPending } = useSignOut();
  const { confirmDeleteAccount, isPending: isDeletePending } = useDeleteAccount();

  return (
    <View style={styles.container}>
      {/* 앱 정보 */}
      <Text style={styles.groupLabel}>앱 정보</Text>
      <View style={styles.group}>
        <MenuItem
          icon="🔒"
          label="개인정보 처리방침"
          onPress={() => router.push("/privacy")}
        />
        <MenuItem
          icon="📄"
          label="이용약관"
          onPress={() => router.push("/terms")}
        />
      </View>

      {/* 계정 */}
      <Text style={styles.groupLabel}>계정</Text>
      <View style={styles.group}>
        <MenuItem
          icon="🔓"
          label="로그아웃"
          onPress={confirmSignOut}
        />
        <MenuItem
          icon="🗑"
          label="회원탈퇴"
          sublabel="계정 및 모든 데이터가 즉시 삭제됩니다"
          onPress={confirmDeleteAccount}
          variant="danger"
        />
      </View>

      {/* 비활성 상태 오버레이 */}
      {(isSignOutPending || isDeletePending) && (
        <View style={styles.loadingOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  groupLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  group: {
    backgroundColor: "#111827",
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
    gap: 12,
  },
  menuIcon: { fontSize: 18, width: 24, textAlign: "center" },
  menuTexts: { flex: 1, gap: 2 },
  menuLabel: { color: "#e5e7eb", fontSize: 15 },
  menuLabelDanger: { color: "#ef4444" },
  menuSublabel: { color: "#6b7280", fontSize: 12 },
  chevron: { color: "#4b5563", fontSize: 18 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 14,
  },
});
