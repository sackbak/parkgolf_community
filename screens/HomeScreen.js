import { useEffect, useState } from 'react';
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
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { timeAgo } from '../utils/timeAgo';
import ComposeScreen from './ComposeScreen';

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [composing, setComposing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    load();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
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
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
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
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardAuthor}>{item.authorName}</Text>
              <Text style={styles.cardWhen}>{timeAgo(item.createdAtDate)}</Text>
            </View>
            <Text style={styles.cardText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 글이 없어요</Text>
            <Text style={styles.emptySub}>첫 글을 남겨보세요 ⛳</Text>
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
        <Text style={styles.fabText}>＋ 한마디 남기기</Text>
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
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
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
