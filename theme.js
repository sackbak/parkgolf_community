// 디자인 토큰 — 모든 화면이 여기서 색·폰트·간격 가져다 씀.
// 색 톤 한 군데 바꾸면 전 화면 같이 바뀜.

export const colors = {
  // 커뮤니티 톤 (파크골프 잔디)
  primary: '#2D5016',
  primaryLight: '#4A7C2E',
  primaryDark: '#1F3A0F',

  // 배경
  bg: '#F5F5F0',
  bgCard: '#FFFFFF',
  bgSubtle: '#F0F0EA',

  // 텍스트
  text: '#222222',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textMuted: '#AAAAAA',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // 보더
  border: '#E0E0DA',
  borderStrong: '#D8D8D0',

  // Go-L 프리미엄 톤 (상품 페이지용)
  premiumBg: '#0E0E0E',
  premiumSurface: '#1A1A1A',
  premiumGold: '#C9A961',
  premiumGoldLight: '#E8D098',

  // 상태
  success: '#4A7C2E',
  danger: '#C04A4A',
  warning: '#E8A317',
};

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};
