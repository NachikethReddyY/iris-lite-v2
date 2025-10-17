import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back gesture
      }}
    >
      <Stack.Screen name="start" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="about" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="connect-pi" />
      <Stack.Screen name="iris-scan" />
    </Stack>
  );
}
