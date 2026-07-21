import { Redirect } from 'expo-router';
import { useBLE } from '@/context/BLEContext';

export default function Index() {
  const { isPaired, isInitialized } = useBLE();

  if (!isInitialized) {
    return null; // Chờ init xong
  }

  if (!isPaired) {
    return <Redirect href={"/(public)/scan" as any} />;
  }

  return <Redirect href={"/(tabs)" as any} />;
}
