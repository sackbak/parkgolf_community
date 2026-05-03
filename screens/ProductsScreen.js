import { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCTS, calcSalePrice, formatWon } from '../constants/products';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme';
import ProductDetailScreen from './ProductDetailScreen';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(null);
  const selected = PRODUCTS.find((p) => p.id === selectedId);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Go-L 스토어</Text>
        <Text style={styles.subtitle}>파크골프채 라인업</Text>
      </View>

      <FlatList
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl + insets.bottom,
        }}
        renderItem={({ item }) => {
          const sale = calcSalePrice(item);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => setSelectedId(item.id)}
            >
              <Image source={item.images[0]} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardBrand}>{item.brand}</Text>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardTagline} numberOfLines={1}>
                  {item.tagline}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.discountBadge}>
                    {item.discountPercent}%
                  </Text>
                  <Text style={styles.salePrice}>{formatWon(sale)}</Text>
                </View>
                <Text style={styles.originalPrice}>
                  정가 {formatWon(item.originalPrice)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <ProductDetailScreen
        product={selected}
        visible={!!selected}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardBrand: {
    fontSize: fontSize.sm,
    color: colors.premiumGold,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  cardName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cardTagline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  discountBadge: {
    backgroundColor: colors.danger,
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  salePrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  originalPrice: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
});
