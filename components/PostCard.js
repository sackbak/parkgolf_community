import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { timeAgo } from '../utils/timeAgo';

export default function PostCard({ post, isVisible }) {
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{post.authorName}</Text>
        <Text style={styles.when}>{timeAgo(post.createdAtDate)}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  when: {
    fontSize: 13,
    color: '#999',
  },
  videoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
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
    borderRadius: 8,
  },
  muteHintText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  text: {
    fontSize: 17,
    color: '#222',
    lineHeight: 24,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});
