import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcSalePrice, formatWon } from '../constants/products';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export default function ProductDetailScreen({ product, visible, onClose }) {
  const insets = useSafeAreaInsets();
  if (!product) return null;

  const sale = calcSalePrice(product);

  const openInquiry = () => {
    if (product.inquiryUrl) {
      Linking.openURL(product.inquiryUrl);
    } else if (product.phone) {
      const tel = product.phone.replace(/[^\d+]/g, '');
      Linking.openURL(`tel:${tel}`);
    } else {
      Alert.alert('준비 중', '카톡채널 오픈 예정입니다.');
    }
  };

  const openPurchase = () => {
    if (product.purchaseUrl) {
      Linking.openURL(product.purchaseUrl);
    } else {
      Alert.alert('준비 중', '스마트스토어 링크 준비 중입니다.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: spacing.md }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {product.brand} {product.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: 140 + insets.bottom,
          }}
        >
          {product.images.map((img, idx) => (
            <Image
              key={idx}
              source={img}
              style={styles.image}
              resizeMode="contain"
            />
          ))}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: spacing.lg + insets.bottom },
          ]}
        >
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.discountBadge}>
                {product.discountPercent}%
              </Text>
              <Text style={styles.salePrice}>{formatWon(sale)}</Text>
            </View>
            <Text style={styles.originalPrice}>
              정가 {formatWon(product.originalPrice)}
            </Text>
          </View>

          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={openInquiry}
            >
              <Text style={styles.secondaryBtnText}>💬 문의하기</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={openPurchase}
            >
              <Text style={styles.primaryBtnText}>🛍 구매하기</Text>
            </Pressable>
          </View>

          <Text style={styles.saleNote}>
            할인 ~ {product.saleEndsAt} 까지
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.premiumBg,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.premiumBg,
  },
  closeText: {
    fontSize: fontSize.md,
    color: colors.textOnDark,
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.premiumGold,
    letterSpacing: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 0.6,
    backgroundColor: colors.premiumBg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.premiumSurface,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  priceBlock: {
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
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
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.premiumGold,
  },
  originalPrice: {
    fontSize: fontSize.sm,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: colors.premiumGold,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.premiumBg,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.premiumGold,
  },
  secondaryBtnText: {
    color: colors.premiumGold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  btnPressed: {
    opacity: 0.7,
  },
  saleNote: {
    color: '#888',
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
