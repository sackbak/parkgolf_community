import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import CourseDetailScreen from './CourseDetailScreen';

const REGION_ORDER = [
  '서울', '경기', '인천', '강원', '강원특별자치도',
  '충북', '충남', '대전', '세종',
  '전북', '전북특별자치도', '전남', '광주',
  '경북', '경남', '대구', '부산', '울산', '제주',
];

const KOREA_CENTER = {
  latitude: 36.5,
  longitude: 127.8,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

export default function CoursesScreen({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('전체');
  const [viewMode, setViewMode] = useState('list');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!visible || courses.length > 0) return;
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, [visible]);

  const filtered = useMemo(() => {
    let list = courses;
    if (region !== '전체') {
      list = list.filter((c) =>
        (c.region || '').includes(region.replace('특별자치도', '')),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [courses, region, search]);

  const availableRegions = useMemo(() => {
    const set = new Set(courses.map((c) => c.region).filter(Boolean));
    return ['전체', ...REGION_ORDER.filter((r) => r !== '전체' && set.has(r))];
  }, [courses]);

  // 지도 모드에서 너무 많은 핀은 성능 저하 → 200개로 제한
  const mapMarkers = useMemo(() => filtered.slice(0, 200), [filtered]);

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
          <Text style={styles.headerTitle}>골프장 ({filtered.length})</Text>
          <View style={styles.toggleWrap}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.toggleBtn,
                viewMode === 'list' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'list' && styles.toggleTextActive,
                ]}
              >
                목록
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('map')}
              style={[
                styles.toggleBtn,
                viewMode === 'map' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'map' && styles.toggleTextActive,
                ]}
              >
                지도
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="이름이나 주소로 검색"
            placeholderTextColor="#AAA"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        <FlatList
          horizontal
          data={availableRegions}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionRow}
          style={styles.regionList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setRegion(item)}
              style={[
                styles.regionChip,
                region === item && styles.regionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.regionChipText,
                  region === item && styles.regionChipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />

        {loading ? (
          <Text style={styles.loadingText}>불러오는 중...</Text>
        ) : viewMode === 'list' ? (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 32 + insets.bottom,
            }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setSelectedCourse(item)}
              >
                <Text style={styles.courseName}>{item.name}</Text>
                <Text style={styles.courseAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                {item.phone ? (
                  <Text style={styles.coursePhone}>{item.phone}</Text>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {search ? '검색 결과가 없어요' : '골프장이 없어요'}
              </Text>
            }
          />
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={KOREA_CENTER}
            >
              {mapMarkers.map((c) => (
                <Marker
                  key={c.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  title={c.name}
                  description={c.address}
                  onCalloutPress={() => setSelectedCourse(c)}
                />
              ))}
            </MapView>
            {filtered.length > mapMarkers.length && (
              <View style={styles.mapHint}>
                <Text style={styles.mapHintText}>
                  지도엔 {mapMarkers.length}곳만 표시 (지역 필터로 좁혀보세요)
                </Text>
              </View>
            )}
          </View>
        )}

        <CourseDetailScreen
          course={selectedCourse}
          visible={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
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
    paddingBottom: 12,
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E0',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#2D5016',
    fontWeight: '600',
  },
  searchWrap: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  regionList: {
    flexGrow: 0,
  },
  regionRow: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0DA',
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  regionChipActive: {
    backgroundColor: '#4A7C2E',
    borderColor: '#4A7C2E',
  },
  regionChipText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 18,
  },
  regionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  cardPressed: {
    backgroundColor: '#F0F0EA',
  },
  courseName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 4,
  },
  courseAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  coursePhone: {
    fontSize: 13,
    color: '#888',
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  mapHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapHintText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
});
