import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { friendshipId } from '../utils/friendCode';

export default function FriendsScreen({ visible, onClose, profile }) {
  const insets = useSafeAreaInsets();
  const [inputCode, setInputCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!visible) return;
    const myUid = auth.currentUser.uid;

    const reqQ = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', myUid),
      where('status', '==', 'pending'),
    );
    const unsubReq = onSnapshot(reqQ, (snap) => {
      setReceived(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const friendQ = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', myUid),
    );
    const unsubFriends = onSnapshot(friendQ, (snap) => {
      setFriends(
        snap.docs.map((d) => {
          const data = d.data();
          const otherUid = data.users.find((u) => u !== myUid);
          return {
            id: d.id,
            uid: otherUid,
            name: data.names?.[otherUid] || '...',
          };
        }),
      );
    });

    return () => {
      unsubReq();
      unsubFriends();
    };
  }, [visible]);

  const handleShare = async () => {
    if (!profile?.friendCode) return;
    await Share.share({
      message: `파크골프 커뮤니티에서 친구 추가하자!\n내 코드: ${profile.friendCode}`,
    });
  };

  const handleAdd = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('확인', '친구 코드는 6자리예요.');
      return;
    }
    if (code === profile?.friendCode) {
      Alert.alert('확인', '내 코드는 입력 못 해요.');
      return;
    }
    setBusy(true);
    try {
      const userQ = query(
        collection(db, 'users'),
        where('friendCode', '==', code),
        limit(1),
      );
      const snap = await getDocs(userQ);
      if (snap.empty) {
        Alert.alert('찾지 못함', '그런 코드를 가진 사용자가 없어요.');
        return;
      }
      const target = snap.docs[0];
      const targetUid = target.id;
      const targetData = target.data();

      const fid = friendshipId(auth.currentUser.uid, targetUid);
      const existingFriendship = await getDocs(
        query(
          collection(db, 'friendships'),
          where('users', 'array-contains', auth.currentUser.uid),
        ),
      );
      if (existingFriendship.docs.some((d) => d.id === fid)) {
        Alert.alert('이미 친구', `${targetData.name}님이랑 이미 친구예요.`);
        setInputCode('');
        return;
      }

      await setDoc(doc(db, 'friendRequests', `${auth.currentUser.uid}_${targetUid}`), {
        fromUid: auth.currentUser.uid,
        fromName: profile?.name || '',
        toUid: targetUid,
        toName: targetData.name,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert('보냈어요', `${targetData.name}님에게 친구 요청을 보냈어요.`);
      setInputCode('');
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (req) => {
    try {
      const fid = friendshipId(req.fromUid, req.toUid);
      await setDoc(doc(db, 'friendships', fid), {
        users: [req.fromUid, req.toUid].sort(),
        names: {
          [req.fromUid]: req.fromName,
          [req.toUid]: req.toName,
        },
        createdAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, 'friendRequests', req.id));
    } catch (e) {
      Alert.alert('오류', e.message);
    }
  };

  const handleReject = async (req) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', req.id));
    } catch (e) {
      Alert.alert('오류', e.message);
    }
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
          <Text style={styles.title}>친구</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          ListHeaderComponent={
            <>
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>내 친구 코드</Text>
                <Text style={styles.codeText} selectable>
                  {profile?.friendCode || '...'}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.shareButton,
                    pressed && styles.shareButtonPressed,
                  ]}
                  onPress={handleShare}
                >
                  <Text style={styles.shareButtonText}>친구에게 공유하기</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>친구 추가</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="친구 코드 6자리"
                  placeholderTextColor="#AAA"
                  value={inputCode}
                  onChangeText={setInputCode}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    (busy || inputCode.length !== 6) && styles.addButtonDisabled,
                    pressed && styles.addButtonPressed,
                  ]}
                  onPress={handleAdd}
                  disabled={busy || inputCode.length !== 6}
                >
                  <Text style={styles.addButtonText}>추가</Text>
                </Pressable>
              </View>

              {received.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>
                    받은 요청 ({received.length})
                  </Text>
                  {received.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <Text style={styles.requestName}>{req.fromName}</Text>
                      <View style={styles.requestActions}>
                        <Pressable
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(req)}
                        >
                          <Text style={styles.acceptText}>수락</Text>
                        </Pressable>
                        <Pressable
                          style={styles.rejectBtn}
                          onPress={() => handleReject(req)}
                        >
                          <Text style={styles.rejectText}>거절</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.sectionTitle}>
                내 친구 ({friends.length})
              </Text>
              {friends.length === 0 && (
                <Text style={styles.emptyFriends}>
                  아직 친구가 없어요. 위 코드를 공유해서 추가해보세요.
                </Text>
              )}
            </>
          }
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendCard}>
              <Text style={styles.friendName}>{item.name}</Text>
            </View>
          )}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 32 + insets.bottom,
          }}
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
    paddingBottom: 16,
  },
  closeText: {
    fontSize: 16,
    color: '#888',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2D5016',
    letterSpacing: 4,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#4A7C2E',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareButtonPressed: {
    backgroundColor: '#2D5016',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    marginTop: 8,
  },
  addRow: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 2,
  },
  addButton: {
    backgroundColor: '#4A7C2E',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#CCC',
  },
  addButtonPressed: {
    backgroundColor: '#2D5016',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: '#4A7C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rejectBtn: {
    backgroundColor: '#EEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectText: {
    color: '#666',
    fontWeight: '600',
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    color: '#2D5016',
    fontWeight: '500',
  },
  emptyFriends: {
    color: '#888',
    fontSize: 14,
    paddingVertical: 12,
  },
});
