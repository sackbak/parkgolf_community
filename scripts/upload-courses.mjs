// scripts/courses.json을 Firestore courses 컬렉션에 업로드.
// 사용: node scripts/upload-courses.mjs
// .env 파일이 프로젝트 루트에 있어야 함.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envText = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

const coursesPath = resolve(__dirname, 'courses.json');
const courses = JSON.parse(readFileSync(coursesPath, 'utf-8'));
console.log(`총 ${courses.length}곳 업로드 시작...`);

const BATCH_SIZE = 400;
let written = 0;
for (let i = 0; i < courses.length; i += BATCH_SIZE) {
  const chunk = courses.slice(i, i + BATCH_SIZE);
  const batch = writeBatch(db);
  for (const c of chunk) {
    const ref = doc(collection(db, 'courses'), c.kakaoId);
    batch.set(ref, {
      ...c,
      region: c.address.split(' ')[0] || '',
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  written += chunk.length;
  console.log(`  ${written}/${courses.length}`);
}

console.log('완료');
process.exit(0);
