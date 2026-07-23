import { Redirect } from 'expo-router';
import { useBLE } from '@/context/BLEContext';
import { useAuthStore } from '@/services/authentication/authStore';

export default function Index() {
  const { isPaired, isInitialized: isBleInitialized } = useBLE();
  const { isAuthenticated, isInitialized: isAuthInitialized } = useAuthStore();

  if (!isBleInitialized || !isAuthInitialized) {
    return null; // Chờ init xong
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(public)/login" as any} />;
  }

  if (!isPaired) {
    return <Redirect href={"/(public)/scan" as any} />;
  }

  return <Redirect href={"/(tabs)" as any} />;
}
