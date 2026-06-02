import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['50%', '90%', '100%'], []);
  
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const { notifications, clearAllNotifs } = useApp();

  return (
    
    <BottomSheetModal
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#141714', borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: '#4a5e4c' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
        <View className="bg-[#141714] rounded-t-[20px] p-4 pb-8 max-h-[90%] w-full flex-1">
          <View className="flex-row items-center justify-between border-b-[0.5px] border-white/5 pb-3 mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">System Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <BottomSheetFlatList
            data={notifications}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-[11px] text-[#4a5e4c] text-center">All systems operational. No unread warnings.</Text>
              </View>
            }
            renderItem={({ item: n }) => (
              <View className="flex-row py-3 border-b-[0.5px] border-white/5 gap-2.5 items-start">
                <View className={`w-2 h-2 rounded-full mt-1 ${n.read === 0 ? 'bg-[#e74c3c]' : 'bg-transparent'}`} />
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-[#f0f4f0]">{n.title}</Text>
                  <Text className="text-[10px] text-[#8a9e8c] my-0.5">{n.message}</Text>
                  <Text className="text-[8px] text-[#4a5e4c]">{new Date(n.date).toLocaleDateString()} · {new Date(n.date).toLocaleTimeString()}</Text>
                </View>
              </View>
            )}
          />

          <TouchableOpacity
            className="bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center mt-2.5"
            onPress={() => {
              clearAllNotifs();
              onClose();
            }}
          >
            <Text className="text-[13px] font-bold text-[#0d1a12]">Mark All as Read</Text>
          </TouchableOpacity>
        </View>
    </BottomSheetModal>
  );
}
