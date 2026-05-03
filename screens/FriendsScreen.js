import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
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
  getDoc,
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
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    load();
  }, []);

  useEffect(() => {
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
  }, []);

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

      await setDoc(
        doc(db, 'friendRequests', `${auth.currentUser.uid}_${targetUid}`),
        {
          fromUid: auth.currentUser.uid,
          fromName: profile?.name || '',
          toUid: targetUid,
          toName: targetData.name,
          status: 'pending',
          createdAt: serverTimestamp(),
        },
      );
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>친구</Text>
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
                placeholderTextColor={colors.textMuted}
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
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl + insets.bottom,
        }}
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
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  codeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadow.card,
  },
  codeLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  codeText: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  shareButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  shareButtonPressed: {
    backgroundColor: colors.primary,
  },
  shareButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: fontSize.lg,
    letterSpacing: 2,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  addButtonDisabled: {
    backgroundColor: colors.borderStrong,
  },
  addButtonPressed: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  requestCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  acceptText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
  rejectBtn: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  rejectText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  friendCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  friendName: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  emptyFriends: {
    color: colors.textTertiary,
    fontSize: fontSize.base,
    paddingVertical: spacing.md,
  },
});
