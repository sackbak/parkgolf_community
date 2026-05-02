import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, db, storage } from '../firebase';

export default function ComposeScreen({ visible, onClose, authorName }) {
  const [text, setText] = useState('');
  const [videoUri, setVideoUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!visible) {
      setText('');
      setVideoUri(null);
      setVideoDuration(0);
      setProgress(0);
    }
  }, [visible]);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 10,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setVideoUri(result.assets[0].uri);
      setVideoDuration(result.assets[0].duration || 0);
    }
  };

  const recordVideo = async () => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 10,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setVideoUri(result.assets[0].uri);
      setVideoDuration(result.assets[0].duration || 0);
    }
  };

  const uploadVideo = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `posts/${auth.currentUser.uid}/${Date.now()}.mp4`;
    const ref = storageRef(storage, path);
    const task = uploadBytesResumable(ref, blob, { contentType: 'video/mp4' });
    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => {
          setProgress(snap.bytesTransferred / snap.totalBytes);
        },
        reject,
        async () => {
          const url = await getDownloadURL(ref);
          resolve({ url, path });
        },
      );
    });
  };

  const handleSend = async () => {
    if (!text.trim() && !videoUri) {
      Alert.alert('확인', '한마디를 쓰거나 영상을 골라주세요.');
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      let videoUrl = null;
      let videoPath = null;
      if (videoUri) {
        const result = await uploadVideo(videoUri);
        videoUrl = result.url;
        videoPath = result.path;
      }

      await addDoc(collection(db, 'posts'), {
        authorId: auth.currentUser.uid,
        authorName,
        text: text.trim(),
        videoUrl,
        videoPath,
        videoDuration: Math.round(videoDuration),
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={handleCancel} hitSlop={12} disabled={busy}>
            <Text style={[styles.cancelText, busy && styles.dim]}>취소</Text>
          </Pressable>
          <Text style={styles.title}>오늘 한마디</Text>
          <Pressable onPress={handleSend} hitSlop={12} disabled={busy}>
            <Text style={[styles.sendText, busy && styles.dim]}>
              {busy
                ? videoUri
                  ? `올리는중 ${Math.round(progress * 100)}%`
                  : '...'
                : '보내기'}
            </Text>
          </Pressable>
        </View>

        {videoUri ? (
          <View style={styles.previewWrap}>
            <VideoView
              player={player}
              style={styles.preview}
              contentFit="cover"
              nativeControls={false}
            />
            <Pressable
              style={styles.removeBtn}
              onPress={() => {
                setVideoUri(null);
                setVideoDuration(0);
              }}
              disabled={busy}
            >
              <Text style={styles.removeBtnText}>영상 빼기</Text>
            </Pressable>
            {videoDuration > 0 && (
              <Text style={styles.durationText}>
                {Math.round(videoDuration)}초
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.pickRow}>
            <Pressable
              style={({ pressed }) => [
                styles.pickButton,
                pressed && styles.pickButtonPressed,
              ]}
              onPress={recordVideo}
            >
              <Text style={styles.pickButtonEmoji}>📹</Text>
              <Text style={styles.pickButtonText}>10초 영상 찍기</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.pickButton,
                pressed && styles.pickButtonPressed,
              ]}
              onPress={pickFromLibrary}
            >
              <Text style={styles.pickButtonEmoji}>📁</Text>
              <Text style={styles.pickButtonText}>갤러리에서 고르기</Text>
            </Pressable>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="한마디 (선택)"
          placeholderTextColor="#AAA"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={280}
          editable={!busy}
        />

        <Text style={styles.counter}>{text.length} / 280</Text>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
  },
  cancelText: {
    fontSize: 16,
    color: '#888',
  },
  sendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A7C2E',
  },
  dim: {
    opacity: 0.4,
  },
  pickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0DA',
  },
  pickButtonPressed: {
    backgroundColor: '#F0F0EA',
  },
  pickButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  pickButtonText: {
    fontSize: 14,
    color: '#2D5016',
    fontWeight: '600',
  },
  previewWrap: {
    marginBottom: 16,
    position: 'relative',
  },
  preview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  durationText: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 80,
    maxHeight: 160,
    fontSize: 18,
    color: '#222',
    textAlignVertical: 'top',
    lineHeight: 26,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  counter: {
    textAlign: 'right',
    color: '#999',
    fontSize: 13,
    marginTop: 8,
  },
});
