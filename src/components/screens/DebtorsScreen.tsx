import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

type DebtorsScreenProps = {
  debtorTab: 'debtors' | 'creditors';
  setDebtorTab: (tab: 'debtors' | 'creditors') => void;
  setSelectedDebtorName: (name: string) => void;
  setPaymentModalVisible: (visible: boolean) => void;
  setSelectedCreditorName: (name: string) => void;
  setCreditorPayModalVisible: (visible: boolean) => void;
};

export default function DebtorsScreen({
  debtorTab,
  setDebtorTab,
  setSelectedDebtorName,
  setPaymentModalVisible,
  setSelectedCreditorName,
  setCreditorPayModalVisible,
}: DebtorsScreenProps) {
  const { debtors, creditors, clearDebtorAccount } = useApp();

  const activeDebtors = debtors.filter(d => (d.totalOwed - d.totalPaid) > 0);
  const activeCreditors = creditors.filter(c => (c.totalOwed - c.totalPaid) > 0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Sub-tabs */}
      <View className="flex-row bg-[#141714] border-[0.5px] border-white/10 rounded-[10px] p-[3px] mb-[14px]">
        <TouchableOpacity
          className={`flex-1 py-[6px] items-center rounded-lg ${debtorTab === 'debtors' ? 'bg-[#1c201b]' : ''}`}
          onPress={() => setDebtorTab('debtors')}
        >
          <Text className={`text-[12px] font-medium ${debtorTab === 'debtors' ? 'text-[#f0f4f0] font-bold' : 'text-[#8a9e8c]'}`}>
            Debtors ({activeDebtors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-[6px] items-center rounded-lg ${debtorTab === 'creditors' ? 'bg-[#1c201b]' : ''}`}
          onPress={() => setDebtorTab('creditors')}
        >
          <Text className={`text-[12px] font-medium ${debtorTab === 'creditors' ? 'text-[#f0f4f0] font-bold' : 'text-[#8a9e8c]'}`}>
            Creditors ({activeCreditors.length})
          </Text>
        </TouchableOpacity>
      </View>

      {debtorTab === 'debtors' ? (
        <View>
          {activeDebtors.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="checkmark-circle-outline" size={44} color="#2ecc71" />
              <Text className="text-[14px] font-bold text-[#f0f4f0] mt-3">No Outstanding Debtors</Text>
              <Text className="text-[12px] text-[#8a9e8c] mt-1">All customer accounts are settled.</Text>
            </View>
          )}
          {activeDebtors.map((debtor, idx) => {
            const outstanding = debtor.totalOwed - debtor.totalPaid;
            return (
              <View key={idx} className="bg-[#141714] border-[0.5px] border-white/5 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-[#f0f4f0]">{debtor.name}</Text>
                    {debtor.phone ? (
                      <Text className="text-[10px] text-[#3498db] mt-[1px]">📞 {debtor.phone}</Text>
                    ) : null}
                    <Text className="text-[9px] text-[#8a9e8c] mt-0.5">
                      Last updated: {new Date(debtor.lastUpdated).toLocaleDateString('en-KE')}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[14px] font-bold text-[#e74c3c]">KES {outstanding.toLocaleString()}</Text>
                    <Text className="text-[8px] text-[#4a5e4c]">Outstanding Balance</Text>
                  </View>
                </View>

                <View className="flex-row justify-between mt-2 border-b-[0.5px] border-white/5 pb-2">
                  <Text className="text-[10px] text-[#8a9e8c]">
                    Total Owed: KES {debtor.totalOwed.toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-[#2ecc71]">
                    Total Paid: KES {debtor.totalPaid.toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-[#2ecc71] items-center justify-center py-[7px] rounded-lg"
                    onPress={() => {
                      setSelectedDebtorName(debtor.name);
                      setPaymentModalVisible(true);
                    }}
                  >
                    <Text className="text-[11px] font-bold text-[#0d1a12]">Record Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-8 h-8 rounded-lg border-[0.5px] border-[#e74c3c]/30 bg-[#e74c3c]/10 items-center justify-center"
                    onPress={() => clearDebtorAccount(debtor.id)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View>
          {activeCreditors.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="checkmark-circle-outline" size={44} color="#2ecc71" />
              <Text className="text-[14px] font-bold text-[#f0f4f0] mt-3">No Outstanding Creditors</Text>
              <Text className="text-[12px] text-[#8a9e8c] mt-1">All supplier accounts are settled.</Text>
            </View>
          )}
          {activeCreditors.map((creditor, idx) => {
            const outstanding = creditor.totalOwed - creditor.totalPaid;
            return (
              <View key={idx} className="bg-[#141714] border-[0.5px] border-white/5 rounded-xl p-3 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-[#f0f4f0]">{creditor.name}</Text>
                    {creditor.phone ? (
                      <Text className="text-[10px] text-[#3498db] mt-[1px]">📞 {creditor.phone}</Text>
                    ) : null}
                    <Text className="text-[9px] text-[#8a9e8c] mt-0.5">
                      Purchase date: {new Date(creditor.lastUpdated).toLocaleDateString('en-KE')}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[14px] font-bold text-[#f39c12]">KES {outstanding.toLocaleString()}</Text>
                    <Text className="text-[8px] text-[#4a5e4c]">We Owe</Text>
                  </View>
                </View>

                <View className="flex-row justify-between mt-2 border-b-[0.5px] border-white/5 pb-2">
                  <Text className="text-[10px] text-[#8a9e8c]">
                    Total Owed: KES {creditor.totalOwed.toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-[#2ecc71]">
                    Total Paid: KES {creditor.totalPaid.toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-[#f39c12] items-center justify-center py-[7px] rounded-lg"
                    onPress={() => {
                      setSelectedCreditorName(creditor.name);
                      setCreditorPayModalVisible(true);
                    }}
                  >
                    <Text className="text-[11px] font-bold text-[#0d1a12]">Record Partial Payment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
