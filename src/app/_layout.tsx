import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/database/AppContext';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Slot />
    </AppProvider>
  );
}
