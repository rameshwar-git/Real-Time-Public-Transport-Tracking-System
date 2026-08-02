import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/signin" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ride-history" />
      <Stack.Screen name="ride-history/[id]" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}