import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CourseDetailScreen({ course, visible, onClose }) {
  const insets = useSafeAreaInsets();
  if (!course) return null;

  const callPhone = () => {
    const tel = course.phone.replace(/[^\d+]/g, '');
    if (tel) Linking.openURL(`tel:${tel}`);
  };

  const openMap = () => {
    if (course.placeUrl) Linking.openURL(course.placeUrl);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: 12 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>골프장</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 32 + insets.bottom,
          }}
        >
          <Text style={styles.name}>{course.name}</Text>
          <Text style={styles.region}>{course.region}</Text>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>주소</Text>
            <Text style={styles.infoValue}>
              {course.roadAddress || course.address}
            </Text>
            {course.roadAddress && course.address ? (
              <Text style={styles.infoSub}>{course.address}</Text>
            ) : null}
          </View>

          {course.phone ? (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>전화</Text>
              <Text style={styles.infoValue}>{course.phone}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {course.phone ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                ]}
                onPress={callPhone}
              >
                <Text style={styles.primaryBtnText}>📞 전화 걸기</Text>
              </Pressable>
            ) : null}
            {course.placeUrl ? (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed,
                ]}
                onPress={openMap}
              >
                <Text style={styles.secondaryBtnText}>🗺 카카오맵에서 보기</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.attribution}>정보 출처: 카카오맵</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 6,
  },
  region: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
  },
  infoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  infoSub: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#4A7C2E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: '#2D5016',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8D8D0',
  },
  secondaryBtnPressed: {
    backgroundColor: '#EEE',
  },
  secondaryBtnText: {
    color: '#2D5016',
    fontSize: 16,
    fontWeight: '600',
  },
  attribution: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 12,
    marginTop: 32,
  },
});
