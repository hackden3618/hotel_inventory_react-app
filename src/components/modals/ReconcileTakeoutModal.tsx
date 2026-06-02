import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, FlatList, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import { TakeoutSession } from '@/database/db';

interface ReconcileTakeoutModalProps {
  visible: boolean;
  onClose: () => void;
  session: TakeoutSession | null;
}

export default function ReconcileTakeoutModal({ visible, onClose, session }: ReconcileTakeoutModalProps) {
  const { reconcileTakeout } = useApp();
  const [items, setItems] = useState<{ mealId: number; name: string; dispatchedQty: number; price: number; unsold: number; cashSold: number; creditSold: number; debtors: { name: string; amount: number }[] }[]>([]);
  const [bulkCash, setBulkCash] = useState('');

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

  useEffect(() => {
    if (session) {
      const dispatchedItems = JSON.parse(session.dispatchedItems);
      setItems(dispatchedItems.map((item: any) => ({
        mealId: item.mealId,
        name: item.name,
        dispatchedQty: item.qty,
        price: item.price,
        unsold: 0,
        cashSold: item.qty,
        creditSold: 0,
        debtors: []
      })));
      
      // Calculate expected initial cash
      const totalInitialCash = dispatchedItems.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0);
      setBulkCash(totalInitialCash.toString());
    }
  }, [session]);

  const handleUpdateItem = (mealId: number, field: 'unsold' | 'cashSold' | 'creditSold', value: string) => {
    const numValue = parseInt(value) || 0;
    setItems(prev => prev.map(item => {
      if (item.mealId === mealId) {
        let newItem = { ...item, [field]: Math.max(0, numValue) };
        
        // Auto balance if unsold changes
        if (field === 'unsold') {
          const remaining = Math.max(0, item.dispatchedQty - newItem.unsold);
          // Prioritize reducing cashSold first, then creditSold if needed
          newItem.creditSold = Math.min(item.creditSold, remaining);
          newItem.cashSold = remaining - newItem.creditSold;
        } else if (field === 'cashSold') {
          const remaining = Math.max(0, item.dispatchedQty - newItem.unsold);
          newItem.cashSold = Math.min(newItem.cashSold, remaining);
          newItem.creditSold = remaining - newItem.cashSold;
        } else if (field === 'creditSold') {
          const remaining = Math.max(0, item.dispatchedQty - newItem.unsold);
          newItem.creditSold = Math.min(newItem.creditSold, remaining);
          newItem.cashSold = remaining - newItem.creditSold;
        }

        return newItem;
      }
      return item;
    }));
  };

  const recalculateCash = () => {
    const expected = items.reduce((sum, item) => sum + (item.cashSold * item.price), 0);
    setBulkCash(expected.toString());
  };

  useEffect(() => {
    recalculateCash();
  }, [items.map(i => i.cashSold).join(',')]);

  const addDebtor = (mealId: number) => {
    setItems(prev => prev.map(item => {
      if (item.mealId === mealId) {
        return { ...item, debtors: [...item.debtors, { name: '', amount: 0 }] };
      }
      return item;
    }));
  };

  const updateDebtor = (mealId: number, index: number, field: 'name' | 'amount', value: string) => {
    setItems(prev => prev.map(item => {
      if (item.mealId === mealId) {
        const newDebtors = [...item.debtors];
        if (field === 'amount') {
          newDebtors[index].amount = parseFloat(value) || 0;
        } else {
          newDebtors[index].name = value;
        }
        return { ...item, debtors: newDebtors };
      }
      return item;
    }));
  };

  const handleSave = () => {
    if (!session) return;

    // Validation
    for (const item of items) {
      if (item.unsold + item.cashSold + item.creditSold !== item.dispatchedQty) {
        Alert.alert('Reconciliation Mismatch', `The sum of Unsold, Cash, and Credit for ${item.name} does not match the dispatched quantity (${item.dispatchedQty}).`);
        return;
      }
      const expectedCreditAmount = item.creditSold * item.price;
      const actualCreditAmount = item.debtors.reduce((s, d) => s + d.amount, 0);
      
      if (item.creditSold > 0 && item.debtors.length === 0) {
        Alert.alert('Missing Debtors', `Please add debtor details for the credit sales of ${item.name}.`);
        return;
      }
      if (expectedCreditAmount !== actualCreditAmount && item.creditSold > 0) {
        Alert.alert('Debtor Mismatch', `The total debtor amounts for ${item.name} (KES ${actualCreditAmount}) does not match the expected credit value (KES ${expectedCreditAmount}).`);
        return;
      }
    }

    const totalCashNum = parseFloat(bulkCash) || 0;
    
    reconcileTakeout(session.id, session.staffName, {
      items: items.map(i => ({
        mealId: i.mealId,
        unsold: i.unsold,
        cashSold: i.cashSold,
        creditSold: i.creditSold,
        debtors: i.debtors.filter(d => d.name.trim() !== '' && d.amount > 0)
      })),
      totalCash: totalCashNum
    });

    onClose();
  };

  if (!session) return null;

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
      <View className="flex-row items-center justify-between p-5 border-b-[0.5px] border-white/5">
        <View>
          <Text className="text-[16px] font-bold text-[#f0f4f0]">Reconcile Takeout</Text>
          <Text className="text-[11px] text-[#8a9e8c] mt-0.5">Staff: {session.staffName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center rounded-full bg-[#1c201b]">
          <Ionicons name="close" size={18} color="#8a9e8c" />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        className="px-5 py-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View>
          {items.map((item) => (
              <View className="mb-4 bg-[#141714] p-3 rounded-[10px] border-[0.5px] border-white/5">
                <View className="flex-row justify-between mb-2 border-b-[0.5px] border-white/5 pb-2">
                  <Text className="text-[14px] font-bold text-[#f0f4f0]">{item.name}</Text>
                  <Text className="text-[12px] font-bold text-[#2ecc71]">Took: {item.dispatchedQty}</Text>
                </View>

                <View className="flex-row justify-between gap-2 mb-3">
                  <View className="flex-1">
                    <Text className="text-[9px] text-[#8a9e8c] mb-1">Unsold (Return)</Text>
                    <TextInput
                      className="bg-[#1c201b] rounded-[6px] h-9 text-center text-[12px] text-[#f0f4f0]"
                      keyboardType="numeric"
                      value={item.unsold.toString()}
                      onChangeText={(val) => handleUpdateItem(item.mealId, 'unsold', val)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[9px] text-[#2ecc71] mb-1">Cash Sold</Text>
                    <TextInput
                      className="bg-[#1c201b] rounded-[6px] h-9 text-center text-[12px] text-[#f0f4f0]"
                      keyboardType="numeric"
                      value={item.cashSold.toString()}
                      onChangeText={(val) => handleUpdateItem(item.mealId, 'cashSold', val)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[9px] text-[#e74c3c] mb-1">Credit Sold</Text>
                    <TextInput
                      className="bg-[#1c201b] rounded-[6px] h-9 text-center text-[12px] text-[#f0f4f0]"
                      keyboardType="numeric"
                      value={item.creditSold.toString()}
                      onChangeText={(val) => handleUpdateItem(item.mealId, 'creditSold', val)}
                    />
                  </View>
                </View>

                {item.creditSold > 0 && (
                  <View className="bg-[#1c201b] rounded-[8px] p-2 mt-1 border-[0.5px] border-[#e74c3c]/20">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-[10px] font-bold text-[#e74c3c]">Debtor Records</Text>
                      <TouchableOpacity onPress={() => addDebtor(item.mealId)}>
                        <Text className="text-[10px] text-[#2ecc71]">+ Add</Text>
                      </TouchableOpacity>
                    </View>
                    {item.debtors.map((debtor, idx) => (
                      <View key={idx} className="flex-row gap-2 mb-2">
                        <TextInput
                          className="flex-[2] bg-[#141714] rounded-[6px] h-8 px-2 text-[11px] text-[#f0f4f0]"
                          placeholder="Debtor Name"
                          placeholderTextColor="#4a5e4c"
                          value={debtor.name}
                          onChangeText={(val) => updateDebtor(item.mealId, idx, 'name', val)}
                        />
                        <TextInput
                          className="flex-1 bg-[#141714] rounded-[6px] h-8 text-center text-[11px] text-[#f0f4f0]"
                          placeholder="Amount"
                          placeholderTextColor="#4a5e4c"
                          keyboardType="numeric"
                          value={debtor.amount ? debtor.amount.toString() : ''}
                          onChangeText={(val) => updateDebtor(item.mealId, idx, 'amount', val)}
                        />
                      </View>
                    ))}
                    {item.debtors.length === 0 && (
                      <Text className="text-[9px] text-[#8a9e8c] italic text-center">Tap + Add to record debtor details.</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
          <View className="mt-2 mb-6">
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mb-2 uppercase">Total Cash Brought In</Text>
                <View className="flex-row items-center bg-[#1c201b] border-[0.5px] border-[#2ecc71]/50 rounded-[10px] px-3 h-12">
                  <Text className="text-[14px] font-bold text-[#2ecc71] mr-2">KES</Text>
                  <TextInput
                    className="flex-1 text-[16px] font-bold text-[#f0f4f0]"
                    keyboardType="numeric"
                    value={bulkCash}
                    onChangeText={setBulkCash}
                  />
                </View>
                <Text className="text-[10px] text-[#8a9e8c] mt-2">
                  Verify the actual cash handed over matches this amount.
                </Text>
              </View>
      </BottomSheetScrollView>

          <View className="px-5 pb-8 pt-3 border-t-[0.5px] border-white/5 bg-[#0d1a12]">
            <TouchableOpacity
              className="bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center"
              onPress={handleSave}
            >
              <Text className="text-[13px] font-bold text-[#0d1a12]">Finalize Reconciliation</Text>
            </TouchableOpacity>
          </View>
    </BottomSheetModal>
  );
}
