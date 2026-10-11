import { Stack } from 'expo-router';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/Toast';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </ToastProvider>
  );
}
