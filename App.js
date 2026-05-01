import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>파크골프 커뮤니티</Text>
      <Text style={styles.subtitle}>안녕하세요, 강석빈님 👋</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>오늘 누른 횟수</Text>
        <Text style={styles.cardNumber}>{count}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonText}>한 번 누르기</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 22,
    color: '#555',
    marginBottom: 48,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 20,
    color: '#666',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  button: {
    backgroundColor: '#4A7C2E',
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#2D5016',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});
