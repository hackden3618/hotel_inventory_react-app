import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

export default function RecordSaleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
  const { meals, recordSale } = useApp();

  const [operant, setOperant] = useState('');
  const [selectedSaleItems, setSelectedSaleItems] = useState<{ [mealId: number]: number }>({});
  const [saleType, setSaleType] = useState<'dinein' | 'takeaway' | 'credit' | 'consumed'>('dinein');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [saleReferenceName, setSaleReferenceName] = useState('');

  const runningTotal = Object.entries(selectedSaleItems).reduce((sum, [mid, qty]) => {
    const m = meals.find(x => x.id === parseInt(mid));
    return sum + (m ? m.price * qty : 0);
  }, 0);

  const handleClose = () => {
    setOperant('');
    setSelectedSaleItems({});
    setSaleType('dinein');
    setSalePaymentMethod('cash');
    setSaleReferenceName('');
    onClose();
  };

  const handleSetQuantity = (mealId: number, stock: number, text: string) => {
    const qty = parseInt(text) || 0;
    setSelectedSaleItems(prev => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[mealId];
        return next;
      }
      return {
        ...prev,
        [mealId]: Math.min(qty, stock)
      };
    });
  };

  const handleRecordSaleSave = () => {
    if (!operant.trim()) {
      Alert.alert('Staff Member Required', 'Please enter the staff member name before saving.');
      return;
    }

    const saleItems = Object.entries(selectedSaleItems)
      .filter(([_, qty]) => qty > 0)
      .map(([mealIdStr, qty]) => {
        const mealId = parseInt(mealIdStr);
        const m = meals.find(x => x.id === mealId)!;
        return { mealId, name: m.name, qty, price: m.price };
      });

    if (saleItems.length === 0) {
      Alert.alert('Empty Cart', 'Select at least one meal and specify the quantity.');
      return;
    }

    if (saleType === 'credit' && !saleReferenceName.trim()) {
      Alert.alert('Debtor Name Required', 'Specify the debtor name for a credit sale.');
      return;
    }

    if (saleType === 'takeaway' && !saleReferenceName.trim()) {
      Alert.alert('Recipient Required', 'Specify who is taking out the meals.');
      return;
    }

    for (const item of saleItems) {
      const dbMeal = meals.find(m => m.id === item.mealId);
      if (!dbMeal) continue;
      if (item.qty <= 0 || isNaN(item.qty)) {
        Alert.alert('Invalid Quantity', 'Quantities must be positive numbers.');
        return;
      }
      if (item.qty > dbMeal.stock) {
        Alert.alert('Stock Exceeded', `Cannot sell ${item.qty} of ${item.name}. Only ${dbMeal.stock} in stock.`);
        return;
      }
    }

    const resolvedPayMethod: 'cash' | 'mpesa' | 'credit' | 'none' =
      saleType === 'credit' ? 'credit'
      : saleType === 'consumed' ? 'none'
      : salePaymentMethod;

    recordSale(
      saleItems,
      saleType,
      resolvedPayMethod,
      operant.trim(),
      saleReferenceName.trim() || undefined,
    );

    setOperant('');
    setSelectedSaleItems({});
    setSaleType('dinein');
    setSalePaymentMethod('cash');
    setSaleReferenceName('');
    onClose();
    Alert.alert('Transaction Successful', 'Recorded offline in database.');
  };

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
      <View className="flex-1 px-5 pt-3">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-white/5 pb-3 mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">Record New Sale</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="mb-2">
                {/* ── STAFF MEMBER (Required) ── */}
                <Text className="text-[10px] font-bold text-[#e74c3c] tracking-[0.8px] mt-1 mb-1.5">
                  STAFF MEMBER (Required)
                </Text>
                <TextInput
                  className={`bg-[#1c201b] border rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3 ${
                    operant.trim() === '' ? 'border-[#e74c3c]/60' : 'border-white/10'
                  }`}
                  placeholder="Enter your name..."
                  placeholderTextColor="#4a5e4c"
                  value={operant}
                  onChangeText={setOperant}
                  autoCapitalize="words"
                />

                {/* ── ITEM GRID ── */}
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-1 mb-1.5">
                  SELECT ITEMS &amp; SPECIFY QUANTITY
                </Text>
            </View>
            
            {meals.map((meal, index) => {
              const currentQty = selectedSaleItems[meal.id] || 0;
              const atMax = currentQty >= meal.stock;
              return (
                <View key={index} className="flex-row items-center py-2.5 border-b border-white/5">
                  {/* Info */}
                  <View className="flex-row items-center flex-1">
                    {meal.image && (meal.image.startsWith('file://') || meal.image.startsWith('content://')) ? (
                      <Image source={{ uri: meal.image }} style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10 }} />
                    ) : (
                      <Text className="text-[24px] mr-2.5">{meal.image}</Text>
                    )}
                    <View>
                      <Text className="text-[13px] font-bold text-[#f0f4f0]">{meal.name}</Text>
                      <Text className="text-[10px] text-[#2ecc71] mt-[1px]">KES {meal.price} each</Text>
                      <Text className="text-[9px] text-[#8a9e8c] mt-[1px]">{meal.stock} in stock</Text>
                    </View>
                  </View>
                  {/* Stepper */}
                  <View className="flex-row items-center border border-white/10 rounded-lg overflow-hidden">
                    <TouchableOpacity
                      className="w-[30px] h-[30px] bg-[#1c201b] items-center justify-center"
                      onPress={() =>
                        setSelectedSaleItems(prev => ({
                          ...prev,
                          [meal.id]: Math.max(0, currentQty - 1),
                        }))
                      }
                    >
                      <Text className="text-[15px] font-bold text-[#f0f4f0]">-</Text>
                    </TouchableOpacity>
                    <TextInput
                      className="text-[13px] font-bold text-[#f0f4f0] w-10 text-center"
                      keyboardType="numeric"
                      value={currentQty > 0 ? currentQty.toString() : ''}
                      onChangeText={(text) => handleSetQuantity(meal.id, meal.stock, text)}
                      placeholder="0"
                      placeholderTextColor="#4a5e4c"
                    />
                    <TouchableOpacity
                      className={`w-[30px] h-[30px] items-center justify-center ${atMax ? 'bg-[#1c201b]/40' : 'bg-[#1c201b]'}`}
                      disabled={atMax}
                      onPress={() =>
                        setSelectedSaleItems(prev => ({
                          ...prev,
                          [meal.id]: Math.min(meal.stock, currentQty + 1),
                        }))
                      }
                    >
                      <Text className={`text-[15px] font-bold ${atMax ? 'text-[#8a9e8c]/50' : 'text-[#f0f4f0]'}`}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            
            <View className="mt-4">
                {/* ── SALE TYPE ── */}
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-4 mb-1.5">SALE TYPE</Text>
                <View className="flex-row bg-[#1c201b] rounded-lg p-[3px] gap-1">
                  {(['dinein', 'takeaway', 'credit', 'consumed'] as const).map((type, i) => (
                    <TouchableOpacity
                      key={i}
                      className={`flex-1 py-2 items-center rounded-lg ${saleType === type ? 'bg-[#141714] border border-white/5' : ''}`}
                      onPress={() => setSaleType(type)}
                    >
                      <Text className={`text-[11px] font-medium ${saleType === type ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'}`}>
                        {type === 'dinein' ? 'Dine-In' : type === 'takeaway' ? 'Take-Out' : type === 'credit' ? 'Credit' : 'Internal'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── DEBTOR NAME ── */}
                {saleType === 'credit' && (
                  <View className="my-2">
                    <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">DEBTOR NAME</Text>
                    <TextInput
                      className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5"
                      placeholder="Enter customer name..."
                      placeholderTextColor="#4a5e4c"
                      value={saleReferenceName}
                      onChangeText={setSaleReferenceName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* ── TAKEN-OUT-BY ── */}
                {saleType === 'takeaway' && (
                  <View className="my-2">
                    <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">TAKEN OUT BY</Text>
                    <TextInput
                      className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5"
                      placeholder="Customer or staff name..."
                      placeholderTextColor="#4a5e4c"
                      value={saleReferenceName}
                      onChangeText={setSaleReferenceName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* ── PAYMENT METHOD (Dine-In / Take-Out only) ── */}
                {(saleType === 'dinein' || saleType === 'takeaway') && (
                  <View className="my-2">
                    <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">PAYMENT METHOD</Text>
                    <View className="flex-row bg-[#1c201b] rounded-lg p-[3px] gap-1">
                      {(['cash', 'mpesa'] as const).map((method, i) => (
                        <TouchableOpacity
                          key={i}
                          className={`flex-1 py-2 items-center rounded-lg ${salePaymentMethod === method ? 'bg-[#141714] border border-white/5' : ''}`}
                          onPress={() => setSalePaymentMethod(method)}
                        >
                          <Text className={`text-[11px] font-medium ${salePaymentMethod === method ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'}`}>
                            {method === 'cash' ? 'Cash' : 'M-Pesa'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* ── RUNNING TOTAL ── */}
                <View className="bg-[#1c201b] border border-white/5 rounded-lg p-3 my-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[12px] text-[#8a9e8c]">Running Total</Text>
                    <Text className="text-[16px] font-bold text-[#2ecc71]">
                      KES {runningTotal.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* ── SAVE BUTTON ── */}
                <TouchableOpacity
                  className="bg-[#2ecc71] rounded-lg py-3 items-center justify-center mt-2.5 mb-2"
                  onPress={handleRecordSaleSave}
                >
                  <Text className="text-[13px] font-bold text-[#0d1a12]">Save Transaction</Text>
                </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}
