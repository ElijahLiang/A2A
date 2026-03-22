/**
 * [模板] React Native 可复用组件模板
 *
 * 使用方式：复制到 apps/mobile/src/components/ 并重命名
 * 示例：apps/mobile/src/components/MatchCard.tsx
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';

// ── Types ────────────────────────────────────────────────

interface TemplateCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'highlighted';
}

// ── Component ────────────────────────────────────────────

export function TemplateCard({
  title,
  subtitle,
  onPress,
  variant = 'default',
}: TemplateCardProps) {
  const isHighlighted = variant === 'highlighted';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isHighlighted && styles.cardHighlighted,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Text
          style={[styles.title, isHighlighted && styles.titleHighlighted]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHighlighted: {
    backgroundColor: '#6C5CE7',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  titleHighlighted: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});
