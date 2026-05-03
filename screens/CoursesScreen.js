import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
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
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
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

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('전체');
  const [viewMode, setViewMode] = useState('list');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

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

  const mapMarkers = useMemo(() => filtered.slice(0, 200), [filtered]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>골프장</Text>
          <Text style={styles.count}>{filtered.length}곳</Text>
        </View>
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
          placeholderTextColor={colors.textMuted}
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
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xxl + insets.bottom,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.sm,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm - 2,
  },
  toggleBtnActive: {
    backgroundColor: colors.bgCard,
  },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  regionList: {
    flexGrow: 0,
    maxHeight: 56,
  },
  regionRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  regionChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  regionChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  regionChipText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  regionChipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.bgSubtle,
  },
  courseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  courseAddress: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  coursePhone: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xxl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xxl,
  },
  mapHint: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  mapHintText: {
    color: colors.textOnDark,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
