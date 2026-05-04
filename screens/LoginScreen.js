import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { URLS } from '../constants/urls';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { generateFriendCode } from '../utils/friendCode';

export default function LoginScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAppleSignIn = async () => {
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple 인증 토큰을 받지 못했어요.');
      }

      const provider = new OAuthProvider('apple.com');
      const firebaseCred = provider.credential({
        idToken: credential.identityToken,
        rawNonce: undefined,
      });
      const result = await signInWithCredential(auth, firebaseCred);

      // 첫 로그인이면 user 문서 생성
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const fullName = credential.fullName;
        const displayName =
          [fullName?.familyName, fullName?.givenName].filter(Boolean).join('') ||
          '사용자';
        await setDoc(userRef, {
          name: displayName,
          email: credential.email || result.user.email || '',
          friendCode: generateFriendCode(),
          createdAt: serverTimestamp(),
          provider: 'apple',
        });
      }
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('오류', e.message);
    } finally {
      setBusy(false);
    }
  };

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
          friendCode: generateFriendCode(),
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
          textContentType="name"
          autoComplete="name"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (6자 이상)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType={isSignup ? 'newPassword' : 'password'}
        autoComplete={isSignup ? 'new-password' : 'current-password'}
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

      {appleAvailable && (
        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.divider} />
        </View>
      )}

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={
            AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
          }
          buttonStyle={
            AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
        />
      )}

      {isSignup && (
        <Text style={styles.legalText}>
          가입하면{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(URLS.terms)}
          >
            이용약관
          </Text>
          과{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(URLS.privacy)}
          >
            개인정보 처리방침
          </Text>
          에 동의하는 것으로 간주됩니다.
        </Text>
      )}
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
  legalText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    lineHeight: 18,
  },
  legalLink: {
    color: '#4A7C2E',
    textDecorationLine: 'underline',
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    color: '#999',
    fontSize: 13,
    paddingHorizontal: 12,
  },
  appleButton: {
    height: 50,
    width: '100%',
    marginTop: 4,
  },
});
