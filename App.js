import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { colors, fontSize, fontWeight } from './theme';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CoursesScreen from './screens/CoursesScreen';
import ProductsScreen from './screens/ProductsScreen';
import FriendsScreen from './screens/FriendsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  홈: '🏠',
  골프장: '⛳',
  상품: '🏷️',
  친구: '👥',
};

function tabIcon(routeName) {
  return ({ focused, color }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
      {TAB_ICONS[routeName]}
    </Text>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryLight} />
          </View>
        ) : user ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: tabIcon(route.name),
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textTertiary,
              tabBarLabelStyle: {
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                marginBottom: 4,
              },
              tabBarStyle: {
                backgroundColor: colors.bgCard,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                paddingTop: 4,
                height: 64,
              },
            })}
          >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="골프장" component={CoursesScreen} />
            <Tab.Screen name="상품" component={ProductsScreen} />
            <Tab.Screen name="친구" component={FriendsScreen} />
          </Tab.Navigator>
        ) : (
          <LoginScreen />
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
