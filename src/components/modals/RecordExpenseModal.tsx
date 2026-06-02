import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

export default function RecordExpenseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
  const { recordExpense } = useApp();

  const [operant, setOperant] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayMethod, setExpensePayMethod] = useState<'cash' | 'mpesa'>('cash');

  const handleClose = () => {
    setOperant('');
    setExpenseTitle('');
    setExpenseAmount('');
    setExpensePayMethod('cash');
    onClose();
  };

  const handleRecordExpenseSave = () => {
    if (!operant.trim()) {
      Alert.alert('Staff Member Required', 'Please enter the name of the staff member logging this expense.');
      return;
    }
    if (!expenseTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter an expense description.');
      return;
    }
    if (!expenseAmount.trim()) {
      Alert.alert('Validation Error', 'Please enter the expense amount.');
      return;
    }
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Amount must be a positive number.');
      return;
    }

    recordExpense(expenseTitle.trim(), amount, expensePayMethod, operant.trim());
    setOperant('');
    setExpenseTitle('');
    setExpenseAmount('');
    setExpensePayMethod('cash');
    onClose();
    Alert.alert('Expense Logged', 'Transaction compiled.');
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
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-white/5 pb-3 mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">Record Business Expense</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <View>

            {/* ── LOGGED BY (Required) ── */}
            <Text className="text-[10px] font-bold text-[#e74c3c] tracking-[0.8px] mt-1 mb-1.5">
              LOGGED BY (Required)
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

            {/* ── EXPENSE DESCRIPTION ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              EXPENSE DESCRIPTION
            </Text>
            <TextInput
              className="bg-[#1c201b] border border-white/10 rounded-lg text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="e.g. Supper bought, Charcoal..."
              placeholderTextColor="#4a5e4c"
              value={expenseTitle}
              onChangeText={setExpenseTitle}
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
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            {/* ── PAYMENT METHOD ── */}
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">
              PAYMENT ACCOUNT
            </Text>
            <View className="flex-row bg-[#1c201b] rounded-lg p-[3px] gap-1 mb-4">
              {(['cash', 'mpesa'] as const).map((method, i) => (
                <TouchableOpacity
                  key={i}
                  className={`flex-1 py-2 items-center rounded-lg ${expensePayMethod === method ? 'bg-[#141714] border border-white/5' : ''}`}
                  onPress={() => setExpensePayMethod(method)}
                >
                  <Text className={`text-[11px] font-medium ${expensePayMethod === method ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'}`}>
                    {method === 'cash' ? 'Cash' : 'M-Pesa'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── SAVE BUTTON ── */}
            <TouchableOpacity
              className="bg-[#2ecc71] rounded-lg py-3 items-center justify-center mt-2.5 mb-2"
              onPress={handleRecordExpenseSave}
            >
              <Text className="text-[13px] font-bold text-[#0d1a12]">Save Expense</Text>
            </TouchableOpacity>
          </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
