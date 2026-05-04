import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { auth } from '../firebase';
import { timeAgo } from '../utils/timeAgo';
import {
  blockUser,
  reportPost,
  showPostMenu,
} from '../utils/moderation';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../theme';

export default function PostCard({ post, isVisible }) {
  const isMine = post.authorId === auth.currentUser?.uid;

  const player = useVideoPlayer(post.videoUrl || null, (p) => {
    if (post.videoUrl) {
      p.loop = true;
      p.muted = true;
    }
  });

  useEffect(() => {
    if (!post.videoUrl || !player) return;
    if (isVisible) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, player, post.videoUrl]);

  const toggleMute = () => {
    if (player) player.muted = !player.muted;
  };

  const openMenu = () => {
    showPostMenu({
      post,
      isMine,
      onReport: async () => {
        try {
          await reportPost(post);
          Alert.alert('신고 접수', '24시간 안에 검토할게요. 감사합니다.');
        } catch (e) {
          Alert.alert('오류', e.message);
        }
      },
      onBlock: () => {
        Alert.alert(
          `${post.authorName} 차단`,
          '이 사용자의 글이 더 이상 보이지 않아요. 친구 관계도 정리됩니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '차단',
              style: 'destructive',
              onPress: async () => {
                try {
                  await blockUser(post.authorId);
                  Alert.alert('차단됨', `${post.authorName}님을 차단했어요.`);
                } catch (e) {
                  Alert.alert('오류', e.message);
                }
              },
            },
          ],
        );
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{post.authorName}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.when}>{timeAgo(post.createdAtDate)}</Text>
          {!isMine && (
            <Pressable onPress={openMenu} hitSlop={12} style={styles.moreBtn}>
              <Text style={styles.moreBtnText}>•••</Text>
            </Pressable>
          )}
        </View>
      </View>

      {post.videoUrl ? (
        <Pressable onPress={toggleMute} style={styles.videoWrap}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
          <View style={styles.muteHint}>
            <Text style={styles.muteHintText}>탭하면 소리 켜짐 🔇</Text>
          </View>
        </Pressable>
      ) : null}

      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  author: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  when: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  moreBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  moreBtnText: {
    color: colors.textTertiary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -1,
  },
  videoWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.md,
    position: 'relative',
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 480,
  },
  muteHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  muteHintText: {
    color: '#FFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  text: {
    fontSize: fontSize.md + 1,
    color: colors.text,
    lineHeight: 24,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
});
