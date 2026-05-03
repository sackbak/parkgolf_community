import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import ComposeScreen from './ComposeScreen';
import FriendsScreen from './FriendsScreen';
import CoursesScreen from './CoursesScreen';
import PostCard from '../components/PostCard';

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [friendUids, setFriendUids] = useState([]);
  const [posts, setPosts] = useState([]);
  const [composing, setComposing] = useState(false);
  const [showingFriends, setShowingFriends] = useState(false);
  const [showingCourses, setShowingCourses] = useState(false);
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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.name}>{profile?.name || '...'}님 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowingCourses(true)} hitSlop={12}>
            <Text style={styles.headerButton}>골프장</Text>
          </Pressable>
          <Pressable onPress={() => setShowingFriends(true)} hitSlop={12}>
            <Text style={styles.headerButton}>친구</Text>
          </Pressable>
          <Pressable onPress={() => signOut(auth)} hitSlop={12}>
            <Text style={styles.signOut}>로그아웃</Text>
          </Pressable>
        </View>
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
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: 16 + insets.bottom },
          pressed && styles.fabPressed,
        ]}
        onPress={() => setComposing(true)}
      >
        <Text style={styles.fabText}>＋ 오늘 한마디</Text>
      </Pressable>

      <ComposeScreen
        visible={composing}
        onClose={() => setComposing(false)}
        authorName={profile?.name || '익명'}
      />

      <FriendsScreen
        visible={showingFriends}
        onClose={() => setShowingFriends(false)}
        profile={profile}
      />

      <CoursesScreen
        visible={showingCourses}
        onClose={() => setShowingCourses(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  headerButton: {
    color: '#4A7C2E',
    fontSize: 15,
    fontWeight: '600',
    padding: 4,
  },
  signOut: {
    color: '#888',
    fontSize: 14,
    padding: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  cardWhen: {
    fontSize: 13,
    color: '#999',
  },
  cardText: {
    fontSize: 17,
    color: '#222',
    lineHeight: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: '#AAA',
  },
  fab: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#4A7C2E',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabPressed: {
    backgroundColor: '#2D5016',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
