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
} from 'react-native';
import { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

export default function RecordPurchaseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { recordPurchase } = useApp();

  const [operant, setOperant] = useState('');
  const [purchaseTitle, setPurchaseTitle] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseCredited, setPurchaseCredited] = useState(false);
  const [dismiss, setDismiss] = React.useState<(() => void) | null>(null);

  const handleClose = () => {
    setOperant('');
    setPurchaseTitle('');
    setPurchaseSupplier('');
    setSupplierPhone('');
    setPurchaseAmount('');
    setPurchaseCredited(false);
    dismiss?.();
  };

  const handleRecordPurchaseSave = () => {
    if (!operant.trim()) {
      Alert.alert('Staff Member Required', 'Please enter the name of the person receiving the goods.');
      return;
    }
    if (!purchaseTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a description for the goods/items.');
      return;
    }
    if (!purchaseAmount.trim()) {
      Alert.alert('Validation Error', 'Please enter the purchase amount.');
      return;
    }
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Amount must be a positive number.');
      return;
    }
    if (!purchaseSupplier.trim()) {
      Alert.alert('Validation Error', 'Please enter the supplier name.');
      return;
    }

    recordPurchase(
      purchaseTitle.trim(),
      amount,
      purchaseCredited,
      purchaseSupplier.trim(),
      operant.trim(),
      supplierPhone.trim() || undefined,
    );

    setOperant('');
    setPurchaseTitle('');
    setPurchaseSupplier('');
    setSupplierPhone('');
    setPurchaseAmount('');
    setPurchaseCredited(false);
    dismiss?.();
    Alert.alert('Restock Logged', 'Purchase recorded.');
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      {({ dismiss: dismissFn }) => {
        if (!dismiss) setDismiss(() => dismissFn);
        return (
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-white/5 pb-3 mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">Record Purchase / Restock</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <View className="px-5">

            {/* ── RECEIVED BY (Required) ── */}
            <Text className="text-[10px] font-bold text-[#e74c3c] tracking-[0.8px] mt-1 mb-1.5">
              RECEIVED BY (Required)
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

            {/* ── ITEM / GOODS DESCRIPTION ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              ITEM / GOODS DESCRIPTION
            </Text>
            <TextInput
              className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="e.g. Wheat Flour restock, Charcoal bag..."
              placeholderTextColor="#4a5e4c"
              value={purchaseTitle}
              onChangeText={setPurchaseTitle}
            />

            {/* ── SUPPLIER NAME ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              SUPPLIER NAME
            </Text>
            <TextInput
              className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="e.g. Kamau Traders..."
              placeholderTextColor="#4a5e4c"
              value={purchaseSupplier}
              onChangeText={setPurchaseSupplier}
              autoCapitalize="words"
            />

            {/* ── SUPPLIER PHONE (optional) ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              SUPPLIER PHONE (optional)
            </Text>
            <TextInput
              className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="e.g. 0712 345 678"
              placeholderTextColor="#4a5e4c"
              keyboardType="phone-pad"
              value={supplierPhone}
              onChangeText={setSupplierPhone}
            />

            {/* ── AMOUNT ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              AMOUNT (KES)
            </Text>
            <TextInput
              className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#4a5e4c"
              value={purchaseAmount}
              onChangeText={setPurchaseAmount}
            />

            {/* ── CREDIT TOGGLE ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              PAYMENT STATUS
            </Text>
            <View className="flex-row bg-[#1c201b] rounded-lg p-[3px] gap-1 mb-4">
              <TouchableOpacity
                className={`flex-1 py-2 items-center rounded-lg ${!purchaseCredited ? 'bg-[#141714] border border-white/5' : ''}`}
                onPress={() => setPurchaseCredited(false)}
              >
                <Text className={`text-[11px] font-medium ${!purchaseCredited ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'}`}>
                  Paid Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 items-center rounded-lg ${purchaseCredited ? 'bg-[#141714] border border-white/5' : ''}`}
                onPress={() => setPurchaseCredited(true)}
              >
                <Text className={`text-[11px] font-medium ${purchaseCredited ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'}`}>
                  Credited (Supplier Owes)
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── SAVE BUTTON ── */}
            <TouchableOpacity
              className="bg-[#2ecc71] rounded-lg py-3 items-center justify-center mt-2.5 mb-2"
              onPress={handleRecordPurchaseSave}
            >
              <Text className="text-[13px] font-bold text-[#0d1a12]">Save Purchase</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
        );
      }}
    </AppBottomSheet>
  );
}