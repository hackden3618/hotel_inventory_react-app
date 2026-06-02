import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

export default function TransactionsScreen() {
  const { transactions } = useApp();
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'sale' | 'credit' | 'takeaway' | 'expense' | 'purchase'>('all');

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <View className="flex-row items-center bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] px-3 py-2 mb-[10px]">
        <Ionicons name="search" size={18} color="#8a9e8c" />
        <TextInput
          className="flex-1 text-[#f0f4f0] text-[13px] p-0 ml-2"
          placeholder="Search history..."
          placeholderTextColor="#4a5e4c"
          value={txSearch}
          onChangeText={setTxSearch}
        />
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
        {['all', 'sale', 'credit', 'takeaway', 'expense', 'purchase'].map((filter, i) => {
          const isActive = txFilter === filter;
          return (
            <TouchableOpacity
              key={i}
              className={`py-1.5 px-3 rounded-[20px] bg-[#1c201b] border-[0.5px] border-white/10 mr-1.5 ${
                isActive ? 'bg-[#2ecc71]/10 border-[#2ecc71]/30' : ''
              }`}
              onPress={() => setTxFilter(filter as any)}
            >
              <Text className={`text-[10px] font-semibold text-[#8a9e8c] ${isActive ? 'text-[#2ecc71]' : ''}`}>
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Transactions lists */}
      <View className="mt-2">
        {transactions
          .filter(t => {
            const matchSearch = t.title.toLowerCase().includes(txSearch.toLowerCase()) || t.description.toLowerCase().includes(txSearch.toLowerCase());
            if (txFilter === 'all') return matchSearch;
            if (txFilter === 'sale') return matchSearch && t.type === 'sale';
            if (txFilter === 'credit') return matchSearch && t.paymentMethod === 'credit';
            if (txFilter === 'takeaway') return matchSearch && t.type === 'takeaway';
            if (txFilter === 'expense') return matchSearch && t.type === 'expense';
            if (txFilter === 'purchase') return matchSearch && t.type === 'purchase';
            return matchSearch;
          })
          .map((tx, idx) => {
            const isExpense = tx.type === 'expense' || tx.type === 'purchase';
            const txColor = tx.type === 'sale' ? '#2ecc71' : tx.type === 'takeaway' || tx.type === 'consumed' ? '#f39c12' : '#e74c3c';
            const amtSign = isExpense ? '-' : '+';
            const date = new Date(tx.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

            return (
              <View key={idx} className="flex-row items-center py-2.5 border-b-[0.5px] border-white/5 gap-[10px]">
                <View 
                  className={`w-8 h-8 rounded-2xl items-center justify-center ${isExpense ? 'bg-[#e74c3c]/10' : 'bg-[#2ecc71]/10'}`}
                >
                  <Ionicons name={isExpense ? "trending-down" : "trending-up"} size={16} color={isExpense ? "#e74c3c" : "#2ecc71"} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-[13px] font-medium text-[#f0f4f0]">{tx.title}</Text>
                    <Text className="text-[8px] text-[#4a5e4c] bg-[#1c201b] px-1 py-[1px] rounded-[3px] ml-1.5">{date}</Text>
                  </View>
                  <Text className="text-[10px] text-[#8a9e8c] mt-[1px]">{tx.description}</Text>
                </View>
                <Text style={{ color: txColor }} className="text-[12px] font-bold">
                  {tx.type === 'takeaway' || tx.type === 'consumed' ? 'Flow' : `${amtSign}KES ${tx.amount.toLocaleString()}`}
                </Text>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}
