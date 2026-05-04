import { Platform, ActionSheetIOS, Alert } from 'react-native';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export function showPostMenu({ post, onReport, onBlock, isMine }) {
  if (isMine) {
    // 내 글이면 차단/신고 의미 없음 (나중에 삭제 메뉴 추가 가능)
    return;
  }

  const options = ['취소', '신고하기', `${post.authorName} 차단`];
  const cancelButtonIndex = 0;
  const destructiveButtonIndex = 2;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex, destructiveButtonIndex },
      (idx) => {
        if (idx === 1) onReport();
        if (idx === 2) onBlock();
      },
    );
  } else {
    Alert.alert('이 글', '', [
      { text: '취소', style: 'cancel' },
      { text: '신고하기', onPress: onReport },
      { text: `${post.authorName} 차단`, style: 'destructive', onPress: onBlock },
    ]);
  }
}

export async function reportPost(post, reason = '부적절한 내용') {
  await addDoc(collection(db, 'reports'), {
    postId: post.id,
    reportedAuthorId: post.authorId,
    reportedAuthorName: post.authorName,
    reportedBy: auth.currentUser.uid,
    reason,
    postSnapshot: {
      text: post.text || '',
      videoUrl: post.videoUrl || null,
    },
    createdAt: serverTimestamp(),
    status: 'pending',
  });
}

export async function blockUser(blockedUid, blockedName = '') {
  const myUid = auth.currentUser.uid;
  await setDoc(
    doc(db, 'users', myUid, 'blocks', blockedUid),
    {
      blockedName,
      blockedAt: serverTimestamp(),
    },
  );
}

export async function unblockUser(blockedUid) {
  const myUid = auth.currentUser.uid;
  await deleteDoc(doc(db, 'users', myUid, 'blocks', blockedUid));
}
