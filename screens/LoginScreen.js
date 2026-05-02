import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function LoginScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !name)) {
      Alert.alert('빈 칸이 있어요', '모든 항목을 채워주세요.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>파크골프 커뮤니티</Text>
      <Text style={styles.subtitle}>
        {isSignup ? '계정 만들기' : '다시 만나요'}
      </Text>

      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="이름"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (6자 이상)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleSubmit}
        disabled={busy}
      >
        <Text style={styles.buttonText}>
          {busy ? '잠시만요…' : isSignup ? '가입하기' : '로그인'}
        </Text>
      </Pressable>

      <Pressable onPress={() => setMode(isSignup ? 'signin' : 'signup')}>
        <Text style={styles.switchText}>
          {isSignup ? '이미 계정 있어요 →' : '처음이라면 계정 만들기 →'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    fontSize: 18,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A7C2E',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  buttonPressed: {
    backgroundColor: '#2D5016',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  switchText: {
    color: '#4A7C2E',
    fontSize: 16,
    textAlign: 'center',
    padding: 12,
  },
});
