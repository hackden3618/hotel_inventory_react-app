import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView, Alert
} from 'react-native';
import { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import { generateLedgerPDF } from '@/utils/pdfGenerator';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
};

export default function LedgerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { transactions, debtors, creditors, businessName, reportPeriod, setReportPeriod } = useApp();
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (t.type === 'day_close') return false;
      const d = new Date(t.date);
      if (reportPeriod === 'today') return d.toDateString() === now.toDateString();
      if (reportPeriod === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (reportPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (reportPeriod === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, reportPeriod]);

  const totalDr = filtered
    .filter(t => ['expense', 'purchase', 'takeaway', 'consumed'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const totalCr = filtered
    .filter(t => ['sale', 'debtor_payment', 'creditor_payment'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const openingBalance = 0;
  const trialBalance = openingBalance + totalCr - totalDr;

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      await generateLedgerPDF(
        businessName,
        filtered,
        debtors,
        creditors,
        PERIOD_LABELS[reportPeriod],
        { totalDr, totalCr, openingBalance, trialBalance }
      );
    } catch (e) {
      Alert.alert('PDF Error', 'Could not generate the report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getRowType = (type: string) => {
    const isDr = ['expense', 'purchase', 'takeaway', 'consumed'].includes(type);
    return isDr ? 'dr' : 'cr';
  };

  const ListHeader = () => (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
        <View>
          <Text className="text-[15px] font-bold text-[#f0f4f0]">Ledger & Trial Balance</Text>
          <Text className="text-[11px] text-[#8a9e8c] mt-0.5">{businessName}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#f0f4f0" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View className="flex-row gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              className={`py-1.5 px-3 rounded-full ${reportPeriod === p ? 'bg-[#2ecc71]' : 'bg-[#1c201b] border border-white/10'}`}
              onPress={() => setReportPeriod(p)}
            >
              <Text className={`text-[11px] font-bold ${reportPeriod === p ? 'text-[#0d1a12]' : 'text-[#8a9e8c]'}`}>
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Trial Balance Summary */}
      <View className="flex-row gap-2 px-4 py-2">
        <View className="flex-1 bg-[#1c201b] rounded-xl p-3 border border-white/5">
          <Text className="text-[9px] text-[#8a9e8c] uppercase tracking-widest">Total Credits (Cr)</Text>
          <Text className="text-[15px] font-bold text-[#2ecc71] mt-0.5">KES {totalCr.toLocaleString()}</Text>
        </View>
        <View className="flex-1 bg-[#1c201b] rounded-xl p-3 border border-white/5">
          <Text className="text-[9px] text-[#8a9e8c] uppercase tracking-widest">Total Debits (Dr)</Text>
          <Text className="text-[15px] font-bold text-[#e74c3c] mt-0.5">KES {totalDr.toLocaleString()}</Text>
        </View>
      </View>
      <View className="mx-4 mb-2 bg-[#2ecc71]/10 border border-[#2ecc71]/20 rounded-xl p-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-[10px] text-[#8a9e8c] uppercase tracking-widest">Trial Balance (Cr − Dr)</Text>
          <Text className={`text-[16px] font-bold ${trialBalance >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
            KES {trialBalance.toLocaleString()}
          </Text>
        </View>
        <Text className="text-[9px] text-[#8a9e8c] mt-1">
          {trialBalance >= 0 ? '✓ Ledger is in credit balance' : '⚠ Ledger shows a debit deficit'}
        </Text>
      </View>

      {/* Table Header */}
      <View className="flex-row border-b border-[#2ecc71]/20 pb-2 mb-1 px-4">
        <Text className="flex-[2] text-[9px] font-bold text-[#8a9e8c] uppercase tracking-widest">Entry</Text>
        <Text className="w-20 text-right text-[9px] font-bold text-[#e74c3c] uppercase tracking-widest">Dr</Text>
        <Text className="w-20 text-right text-[9px] font-bold text-[#2ecc71] uppercase tracking-widest">Cr</Text>
      </View>
    </>
  );

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
        <View className="bg-[#141714] rounded-t-[20px] max-h-[90%] w-full flex-1">
          <BottomSheetFlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            ListHeaderComponent={<ListHeader />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Ionicons name="document-text-outline" size={40} color="#4a5e4c" />
                <Text className="text-[13px] text-[#8a9e8c] mt-3">No entries for this period</Text>
              </View>
            }
            renderItem={({ item: tx }) => {
              const isDr = getRowType(tx.type) === 'dr';
              const dateStr = new Date(tx.date).toLocaleDateString('en-KE', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              });
              return (
                <View className="flex-row items-start py-2.5 border-b border-white/5 px-4">
                  <View className="flex-[2] pr-2">
                    <Text className="text-[12px] font-semibold text-[#f0f4f0]" numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text className="text-[10px] text-[#8a9e8c] mt-[1px]" numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text className="text-[9px] text-[#4a5e4c] mt-[1px]">
                      {dateStr}{tx.operant ? ` · ${tx.operant}` : ''}
                    </Text>
                  </View>
                  <Text className="w-20 text-right text-[12px] font-bold text-[#e74c3c]">
                    {isDr ? `KES ${tx.amount.toLocaleString()}` : ''}
                  </Text>
                  <Text className="w-20 text-right text-[12px] font-bold text-[#2ecc71]">
                    {!isDr ? `KES ${tx.amount.toLocaleString()}` : ''}
                  </Text>
                </View>
              );
            }}
            ListFooterComponent={<View className="h-4" />}
          />

          {/* PDF Button */}
          <View className="px-4 pb-8 pt-2 border-t border-white/5">
            <TouchableOpacity
              className={`flex-row items-center justify-center py-3 rounded-[12px] gap-2 ${generating ? 'bg-[#1c201b]' : 'bg-[#2ecc71]'}`}
              onPress={handleGeneratePDF}
              disabled={generating}
            >
              <Ionicons name="download-outline" size={18} color={generating ? '#8a9e8c' : '#0d1a12'} />
              <Text className={`text-[13px] font-bold ${generating ? 'text-[#8a9e8c]' : 'text-[#0d1a12]'}`}>
                {generating ? 'Generating PDF...' : 'Download PDF Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
    </AppBottomSheet>
  );
}