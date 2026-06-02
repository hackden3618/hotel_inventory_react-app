import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useApp } from '@/database/AppContext';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'debtor' | 'creditor';
  personName: string;
}

export default function PaymentModal({ visible, onClose, type, personName }: PaymentModalProps) {
  const { recordDebtorPayment, recordCreditorPayment } = useApp();

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'mpesa'>('cash');
  const [operant, setOperant] = useState('');

  useEffect(() => {
    if (visible) {
      setPayAmount('');
      setPayMethod('cash');
      setOperant('');
    }
  }, [visible]);

  const handleSave = () => {
    if (!operant.trim()) {
      Alert.alert('Staff Name Required', 'Please enter the name of the staff member handling this payment.');
      return;
    }
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid positive amount.');
      return;
    }

    if (type === 'debtor') {
      recordDebtorPayment(personName, amount, payMethod, operant.trim());
    } else {
      recordCreditorPayment(personName, amount, payMethod, operant.trim());
    }

    onClose();
  };

  const isDebtor = type === 'debtor';

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 pt-5 pb-3 border-b-[0.5px] border-white/5 flex-row items-start justify-between">
          <View>
            <Text className="text-[15px] font-bold text-[#f0f4f0]">
              {isDebtor ? 'Record Debtor Payment' : 'Remit Creditor Settlement'}
            </Text>
            <Text className="text-[11px] text-[#2ecc71] mt-0.5">{personName}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#f0f4f0" />
          </TouchableOpacity>
        </View>

            <View className="px-5 py-4">
              {/* Operant — REQUIRED */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mb-1.5 uppercase">
                  Received/Paid By (Required)
                </Text>
                <TextInput
                  className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
                  placeholder="Staff name..."
                  placeholderTextColor="#4a5e4c"
                  value={operant}
                  onChangeText={setOperant}
                  autoCorrect={false}
                />
                {operant.trim() === '' && (
                  <Text className="text-[10px] text-[#e74c3c] mt-1">* This field is required</Text>
                )}
              </View>

              {/* Amount */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mb-1.5 uppercase">
                  {isDebtor ? 'Amount Remitted (KES)' : 'Remittance Amount (KES)'}
                </Text>
                <TextInput
                  className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#4a5e4c"
                  value={payAmount}
                  onChangeText={setPayAmount}
                />
              </View>

              {/* Payment Method — shown for both debtor and creditor */}
              <View className="mb-5">
                <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mb-1.5 uppercase">
                  {isDebtor ? 'Collection Channel' : 'Payment Channel'}
                </Text>
                <View className="flex-row bg-[#1c201b] rounded-[10px] p-[3px] gap-1">
                  {(['cash', 'mpesa'] as const).map((method) => (
                    <TouchableOpacity
                      key={method}
                      className={`flex-1 py-2 items-center rounded-lg ${
                        payMethod === method
                          ? 'bg-[#141714] border-[0.5px] border-white/5'
                          : ''
                      }`}
                      onPress={() => setPayMethod(method)}
                    >
                      <Text
                        className={`text-[11px] font-medium ${
                          payMethod === method ? 'text-[#2ecc71] font-bold' : 'text-[#8a9e8c]'
                        }`}
                      >
                        {method === 'cash' ? '💵  Cash' : '📱  M-Pesa'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 px-5 pb-5 mt-4">
              <TouchableOpacity
                className="flex-1 bg-[#1c201b] border-[0.5px] border-white/5 rounded-[10px] py-3 items-center justify-center"
                onPress={onClose}
              >
                <Text className="text-[13px] font-bold text-[#f0f4f0]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center"
                onPress={handleSave}
              >
                <Text className="text-[13px] font-bold text-[#0d1a12]">
                  {isDebtor ? 'Confirm' : 'Remit Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
    </AppBottomSheet>
  );
}