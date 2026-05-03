// 상품 카탈로그.
// 가격/링크/유효기간은 나중에 Firestore로 옮겨서 콘솔에서 수정 가능하게 할 예정.
// 지금은 프로토타입이라 코드에 박음.

export const PRODUCTS = [
  {
    id: 'g100',
    brand: 'Go-L',
    name: 'G100',
    subtitle: 'The First Signature Model',
    tagline: '프리미엄 파크 골프채의 새로운 기준',
    originalPrice: 720000,
    discountPercent: 35,
    saleEndsAt: '2026-05-31',
    inquiryUrl: '',  // 카톡채널 링크 (예정)
    purchaseUrl: '', // 네이버 스마트스토어 폐쇄링크
    phone: '',       // 옵션
    images: [
      require('../assets/products/g100/G100_01.png'),
      require('../assets/products/g100/G100_02.png'),
      require('../assets/products/g100/G100_03.png'),
      require('../assets/products/g100/G100_04.png'),
      require('../assets/products/g100/g100_05.png'),
      require('../assets/products/g100/g100_05_1_GIF.png'),
      require('../assets/products/g100/G100_06.png'),
      require('../assets/products/g100/G100_06_1.png'),
      require('../assets/products/g100/G100_07.png'),
      require('../assets/products/g100/G100_07_1_GIF.png'),
      require('../assets/products/g100/G100_07_2.png'),
      require('../assets/products/g100/G100_08.png'),
      require('../assets/products/g100/G100_09.png'),
      require('../assets/products/g100/G100_10.png'),
      require('../assets/products/g100/G100_11.png'),
      require('../assets/products/g100/G100_12.png'),
      require('../assets/products/g100/G100_13.png'),
      require('../assets/products/g100/G100_14.png'),
      require('../assets/products/g100/G100_15.png'),
      require('../assets/products/g100/G100_16.png'),
    ],
  },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function calcSalePrice(p) {
  return Math.round(p.originalPrice * (1 - p.discountPercent / 100));
}

export function formatWon(n) {
  return n.toLocaleString('ko-KR') + '원';
}
