import { Stack } from 'expo-router';

export default function HouseholdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="create" />
      <Stack.Screen name="join" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}