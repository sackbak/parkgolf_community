import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const DUMMY_FEED = [
  { id: '1', author: '민수', when: '방금 전', emoji: '🏌️' },
  { id: '2', author: '영희', when: '1시간 전', emoji: '⛳' },
  { id: '3', author: '준호', when: '오늘 오전', emoji: '🌳' },
];

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
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
        data={DUMMY_FEED}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardAuthor}>{item.author}</Text>
              <Text style={styles.cardWhen}>{item.when}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => alert('곧 카메라 화면이 생겨요')}
      >
        <Text style={styles.fabText}>＋ 영상 올리기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    paddingTop: 60,
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardAuthor: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
  },
  cardWhen: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
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
