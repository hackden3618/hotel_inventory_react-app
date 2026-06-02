import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import { updateSetting, getSetting } from '@/database/db';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[1.2px] uppercase mt-5 mb-2">
      {label}
    </Text>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] uppercase mb-1.5">
      {label}
    </Text>
  );
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { businessName, saveBusinessName, transactions, closeDay, resetDatabase } = useApp();

  const [tempBusinessName, setTempBusinessName] = useState(businessName);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closeDayOperant, setCloseDayOperant] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [dismiss, setDismiss] = React.useState<(() => void) | null>(null);

  // ─── Sync state when modal opens ─────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setTempBusinessName(businessName);
      setCloseDayOperant('');
      const savedOb = getSetting('opening_balance');
      setOpeningBalance(savedOb || '0');
    }
  }, [visible, businessName]);

  // ─── Today's summary ─────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => new Date(t.date).toDateString() === today);
  const todaySales = todayTx
    .filter(t => t.type === 'sale' || t.type === 'takeaway')
    .reduce((s, t) => s + t.amount, 0);
  const todayExpenses = todayTx
    .filter(t => t.type === 'expense' || t.type === 'purchase')
    .reduce((s, t) => s + t.amount, 0);
  const netBalanceBF = todaySales - todayExpenses;

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveBusinessName = () => {
    if (!tempBusinessName.trim()) {
      Alert.alert('Validation', 'Business name cannot be empty.');
      return;
    }
    saveBusinessName(tempBusinessName.trim());
    Alert.alert('✅ Saved', 'Business name updated successfully.');
  };

  const handleSaveOpeningBalance = () => {
    const val = parseFloat(openingBalance);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Opening balance must be a non-negative number.');
      return;
    }
    updateSetting('opening_balance', String(val));
    Alert.alert('✅ Saved', 'Opening balance updated.');
  };

  const handleCloseDay = () => {
    if (!closeDayOperant.trim()) {
      Alert.alert('Staff Name Required', 'Please enter the operant (staff) name to close the day.');
      return;
    }

    Alert.alert(
      'Close Day?',
      `This will archive today's activity.\n\nSales: ${fmt(todaySales)}\nExpenses: ${fmt(todayExpenses)}\nNet B/F: ${fmt(netBalanceBF)}\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Day',
          style: 'destructive',
          onPress: () => {
            closeDay(closeDayOperant.trim());
            setCloseDayOperant('');
            Alert.alert(
              '✅ Day Closed',
              `Closed by ${closeDayOperant.trim()}.\nNet Balance B/F: ${fmt(netBalanceBF)}`
            );
          },
        },
      ]
    );
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      {({ dismiss: dismissFn }) => {
        if (!dismiss) setDismiss(() => dismissFn);
        return (
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-white/10" />
          </View>

          {/* Top bar */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b-[0.5px] border-white/5">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">Settings</Text>
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-[#1c201b] items-center justify-center"
              onPress={() => dismiss?.()}
            >
              <Ionicons name="close" size={18} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <View className="px-5 flex-1">
            {/* ── Business Profile ─────────────────────────────────────────── */}
            <SectionHeader label="Business Profile" />

            <FieldLabel label="Business / Hotel Name" />
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-2.5"
              placeholder="Enter business name..."
              placeholderTextColor="#4a5e4c"
              value={tempBusinessName}
              onChangeText={setTempBusinessName}
            />
            <TouchableOpacity
              className="bg-[#1c201b] border-[0.5px] border-[#2ecc71]/30 rounded-[10px] py-3 items-center justify-center"
              onPress={handleSaveBusinessName}
            >
              <Text className="text-[12px] font-bold text-[#2ecc71]">Save Business Name</Text>
            </TouchableOpacity>

            {/* ── Financial Settings ────────────────────────────────────────── */}
            <SectionHeader label="Financial Settings" />

            <FieldLabel label="Opening Balance (KES)" />
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-2.5"
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#4a5e4c"
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />
            <TouchableOpacity
              className="bg-[#1c201b] border-[0.5px] border-[#2ecc71]/30 rounded-[10px] py-3 items-center justify-center"
              onPress={handleSaveOpeningBalance}
            >
              <Text className="text-[12px] font-bold text-[#2ecc71]">Save Opening Balance</Text>
            </TouchableOpacity>

            {/* ── Close Day / New Day ───────────────────────────────────────── */}
            <SectionHeader label="Close Day / New Day" />

            {/* Today's summary card */}
            <View className="bg-[#1c201b] border-[0.5px] border-white/5 rounded-[14px] p-4 mb-4 gap-2">
              <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] uppercase mb-1">
                Today's Summary
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-[12px] text-[#8a9e8c]">Today's Sales</Text>
                <Text className="text-[12px] font-bold text-[#2ecc71]">{fmt(todaySales)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[12px] text-[#8a9e8c]">Today's Expenses</Text>
                <Text className="text-[12px] font-bold text-[#e74c3c]">{fmt(todayExpenses)}</Text>
              </View>
              <View className="h-[0.5px] bg-white/5 my-1" />
              <View className="flex-row justify-between">
                <Text className="text-[12px] text-[#8a9e8c]">Net Balance B/F</Text>
                <Text
                  className={`text-[13px] font-bold ${netBalanceBF >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}
                >
                  {fmt(netBalanceBF)}
                </Text>
              </View>
            </View>

            {/* Operant field — REQUIRED */}
            <FieldLabel label="Closed By — Staff Name (Required)" />
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
              placeholder="Staff / Operator name..."
              placeholderTextColor="#4a5e4c"
              value={closeDayOperant}
              onChangeText={setCloseDayOperant}
              autoCorrect={false}
            />
            {closeDayOperant.trim() === '' && (
              <Text className="text-[10px] text-[#e74c3c] -mt-2 mb-3">* Required to close day</Text>
            )}

            <TouchableOpacity
              className="bg-[#2ecc71] rounded-[12px] py-4 items-center justify-center"
              onPress={handleCloseDay}
            >
              <Text className="text-[13px] font-bold text-[#0d1a12]">🔒  Close Day & Begin New Day</Text>
            </TouchableOpacity>

            <Text className="text-[10px] text-[#4a5e4c] text-center mt-2 mb-6">
              All today's activity will be archived. This cannot be undone.
            </Text>

            {/* ── Danger Zone ───────────────────────────────────────── */}
            <SectionHeader label="Danger Zone" />

            {!showResetConfirm ? (
              <TouchableOpacity
                className="bg-[#e74c3c]/10 border-[0.5px] border-[#e74c3c]/30 rounded-[12px] py-4 items-center justify-center mt-2"
                onPress={() => setShowResetConfirm(true)}
              >
                <Text className="text-[13px] font-bold text-[#e74c3c]">⚠ Reset Database</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-[#e74c3c]/5 border-[0.5px] border-[#e74c3c]/30 rounded-[14px] p-4 mt-2">
                <Text className="text-[11px] font-bold text-[#e74c3c] mb-2">
                  Type the security password to confirm deletion of ALL data:
                </Text>
                <TextInput
                  className="bg-[#1c201b] border-[0.5px] border-[#e74c3c]/40 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5 mb-3"
                  placeholder="Enter password..."
                  placeholderTextColor="#4a5e4c"
                  secureTextEntry
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  autoCorrect={false}
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] py-3 items-center"
                    onPress={() => { setShowResetConfirm(false); setResetPassword(''); }}
                  >
                    <Text className="text-[12px] font-bold text-[#f0f4f0]">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-[#e74c3c] rounded-[10px] py-3 items-center"
                    onPress={() => {
                      if (resetPassword === 'killalldata!') {
                        resetDatabase();
                        setShowResetConfirm(false);
                        setResetPassword('');
                        Alert.alert('Database Reset', 'All data has been wiped. Starting fresh.');
                      } else {
                        Alert.alert('Incorrect Password', 'The password you entered is wrong. Reset aborted.');
                        setResetPassword('');
                      }
                    }}
                  >
                    <Text className="text-[12px] font-bold text-white">Confirm Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
      </BottomSheetScrollView>
        );
      }}
    </AppBottomSheet>
  );
}