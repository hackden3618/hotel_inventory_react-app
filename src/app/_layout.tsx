import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/database/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '@/global.css';

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <BottomSheetModalProvider>
          <StatusBar style="light" />
          <Slot />
        </BottomSheetModalProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
