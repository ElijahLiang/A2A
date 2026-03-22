/**
 * [模板] React Native 页面模板
 *
 * 使用方式：复制到 apps/mobile/src/screens/ 并重命名
 * 示例：apps/mobile/src/screens/MatchDetailScreen.tsx
 */

import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams } from 'expo-router';
// import { useQuery } from '@tanstack/react-query';

// ── Types ────────────────────────────────────────────────

interface ScreenData {
  id: string;
  title: string;
}

// ── Screen Component ─────────────────────────────────────

export function TemplateScreen() {
  // const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: 替换为实际的数据查询
  const isLoading = false;
  const error = null;
  const data: ScreenData | null = null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>加载失败，请重试</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TODO: 页面内容 */}
        <Text style={styles.title}>页面标题</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
  },
});
