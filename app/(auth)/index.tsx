import { Redirect } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { View, StyleSheet } from 'react-native';
import { Spinner } from '@/components/ui';

export default function AuthIndex() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.center}><Spinner /></View>;
  if (user) return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
