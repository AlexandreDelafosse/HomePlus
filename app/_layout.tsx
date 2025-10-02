import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function RootLayoutNav() {
  const { user, userProfile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // ✅ Change le type pour React Native
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Annuler tout timeout de navigation en cours
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    if (loading) {
      console.log('⏳ Loading auth...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inHouseholdGroup = segments[0] === '(household)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('🔍 Navigation Debug:', {
      user: !!user,
      hasProfile: !!userProfile,
      householdCount: userProfile?.householdIds?.length || 0,
      currentSegment: segments[0],
      specificRoute: segments[1],
    });

    // ❌ Pas connecté → Auth
    if (!user) {
      if (!inAuthGroup) {
        console.log('➡️ Redirection vers auth/welcome');
        navigationTimeoutRef.current = setTimeout(() => {
          router.replace('/(auth)/welcome');
        }, 100);
      }
      return;
    }

    // ⏳ Connecté mais pas de profil chargé → attendre
    if (user && !userProfile) {
      console.log('⏳ En attente du profil utilisateur...');
      return;
    }

    // 🏠 Connecté mais pas de foyer → Onboarding/Create/Join uniquement
    if (user && userProfile && (!userProfile.householdIds || userProfile.householdIds.length === 0)) {
      // Autoriser onboarding, create, join
      if (inHouseholdGroup && ['onboarding', 'create', 'join'].includes(segments[1] || '')) {
        console.log('✅ Route household autorisée sans foyer');
        return;
      }
      
      if (!inHouseholdGroup) {
        console.log('➡️ Redirection vers household/onboarding');
        navigationTimeoutRef.current = setTimeout(() => {
          router.replace('/(household)/onboarding');
        }, 100);
      }
      return;
    }

    // ✅ Connecté AVEC foyer
    if (user && userProfile && userProfile.householdIds && userProfile.householdIds.length > 0) {
      // 🔓 AUTORISER l'accès à TOUTES les routes household (y compris invite)
      if (inHouseholdGroup) {
        console.log('✅ Route household autorisée avec foyer:', segments[1]);
        return;
      }

      // Si on n'est ni dans tabs ni dans household, aller aux tabs
      if (!inTabsGroup && !inHouseholdGroup) {
        console.log('➡️ Redirection vers tabs');
        navigationTimeoutRef.current = setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }
      return;
    }

  }, [user, userProfile, segments, loading, router]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(household)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});