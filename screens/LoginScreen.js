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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);

  const isSignup = mode === 'signup';
  const consentsOk = !isSignup || (agreedTerms && agreedPrivacy);

  const consentMeta = () => ({
    consentedAt: serverTimestamp(),
    consentedTermsVersion: '2026-05-04',
    consentedPrivacyVersion: '2026-05-04',
    marketingConsent: agreedMarketing,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAppleSignIn = async () => {
    if (!consentsOk) {
      Alert.alert('동의 필요', '이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }
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
          ...consentMeta(),
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
    if (isSignup && !consentsOk) {
      Alert.alert('동의 필요', '이용약관과 개인정보 처리방침에 동의해주세요.');
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
          provider: 'email',
          ...consentMeta(),
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

      {isSignup && (
        <View style={styles.consentBox}>
          <Pressable
            style={styles.consentRow}
            onPress={() => setAgreedTerms(!agreedTerms)}
          >
            <View style={[styles.checkbox, agreedTerms && styles.checkboxOn]}>
              {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              <Text style={styles.required}>(필수) </Text>
              <Text
                style={styles.consentLink}
                onPress={() => Linking.openURL(URLS.terms)}
              >
                이용약관
              </Text>
              에 동의합니다.
            </Text>
          </Pressable>

          <Pressable
            style={styles.consentRow}
            onPress={() => setAgreedPrivacy(!agreedPrivacy)}
          >
            <View style={[styles.checkbox, agreedPrivacy && styles.checkboxOn]}>
              {agreedPrivacy && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              <Text style={styles.required}>(필수) </Text>
              <Text
                style={styles.consentLink}
                onPress={() => Linking.openURL(URLS.privacy)}
              >
                개인정보 처리방침
              </Text>
              에 동의합니다.
            </Text>
          </Pressable>

          <Pressable
            style={styles.consentRow}
            onPress={() => setAgreedMarketing(!agreedMarketing)}
          >
            <View
              style={[styles.checkbox, agreedMarketing && styles.checkboxOn]}
            >
              {agreedMarketing && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              <Text style={styles.optional}>(선택) </Text>
              마케팅 정보 및 푸시 알림 수신에 동의합니다.
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!consentsOk || busy) && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={busy || !consentsOk}
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
  consentBox: {
    marginVertical: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 12,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#BBB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: '#4A7C2E',
    borderColor: '#4A7C2E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  required: {
    color: '#C04A4A',
    fontWeight: '600',
  },
  optional: {
    color: '#888',
    fontWeight: '600',
  },
  consentLink: {
    color: '#4A7C2E',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
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
