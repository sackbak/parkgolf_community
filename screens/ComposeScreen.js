import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function ComposeScreen({ visible, onClose, authorName }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: auth.currentUser.uid,
        authorName,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setText('');
      onClose();
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setText('');
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
          <Pressable onPress={handleCancel} hitSlop={12}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
          <Text style={styles.title}>오늘 한마디</Text>
          <Pressable
            onPress={handleSend}
            disabled={busy || !text.trim()}
            hitSlop={12}
          >
            <Text
              style={[
                styles.sendText,
                (!text.trim() || busy) && styles.sendDisabled,
              ]}
            >
              {busy ? '...' : '보내기'}
            </Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="오늘 라운딩 어땠어요?"
          placeholderTextColor="#AAA"
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          maxLength={280}
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
    marginBottom: 24,
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
  sendDisabled: {
    color: '#CCC',
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#222',
    textAlignVertical: 'top',
    lineHeight: 28,
  },
  counter: {
    textAlign: 'right',
    color: '#999',
    fontSize: 13,
    marginTop: 8,
  },
});
