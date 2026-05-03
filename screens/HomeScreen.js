import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { generateFriendCode } from '../utils/friendCode';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme';
import ComposeScreen from './ComposeScreen';
import PostCard from '../components/PostCard';

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [friendUids, setFriendUids] = useState([]);
  const [posts, setPosts] = useState([]);
  const [composing, setComposing] = useState(false);
  const [visibleIds, setVisibleIds] = useState(new Set());
  const insets = useSafeAreaInsets();

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    setVisibleIds(new Set(viewableItems.map((v) => v.item.id)));
  }, []);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.friendCode) {
          const code = generateFriendCode();
          await updateDoc(ref, { friendCode: code });
          setProfile({ ...data, friendCode: code });
        } else {
          setProfile(data);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const myUid = auth.currentUser.uid;
    const friendQ = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', myUid),
    );
    const unsub = onSnapshot(friendQ, (snap) => {
      const uids = snap.docs
        .map((d) => d.data().users.find((u) => u !== myUid))
        .filter(Boolean);
      setFriendUids(uids);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const myUid = auth.currentUser.uid;
    const visibleAuthors = [myUid, ...friendUids];
    const q = query(
      collection(db, 'posts'),
      where('authorId', 'in', visibleAuthors),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAtDate: data.createdAt?.toDate?.() ?? null,
          };
        }),
      );
    });
    return unsub;
  }, [friendUids]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.name}>{profile?.name || '...'}님 👋</Text>
        </View>
        <Pressable onPress={() => signOut(auth)} hitSlop={12}>
          <Text style={styles.signOut}>로그아웃</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>오늘의 친구들</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} isVisible={visibleIds.has(item.id)} />
        )}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 글이 없어요</Text>
            <Text style={styles.emptySub}>
              {friendUids.length === 0
                ? '친구를 추가하고 첫 글을 남겨보세요 ⛳'
                : '첫 글을 남겨보세요 ⛳'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setComposing(true)}
      >
        <Text style={styles.fabText}>＋ 오늘 한마디</Text>
      </Pressable>

      <ComposeScreen
        visible={composing}
        onClose={() => setComposing(false)}
        authorName={profile?.name || '익명'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  signOut: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    padding: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.lg - 2,
    alignItems: 'center',
    ...shadow.fab,
  },
  fabPressed: {
    backgroundColor: colors.primary,
  },
  fabText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
