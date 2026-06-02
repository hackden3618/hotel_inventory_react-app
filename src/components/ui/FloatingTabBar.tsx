import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabName = 'home' | 'transactions' | 'inventory' | 'debtors' | 'ai';

type FloatingTabBarProps = {
  currentTab: TabName;
  setCurrentTab: (tab: TabName) => void;
};

export default function FloatingTabBar({ currentTab, setCurrentTab }: FloatingTabBarProps) {
  // We use inline shadow styles for Platform specific shadows as Tailwind support for complex shadows in React Native can be limited.
  // Alternatively, standard tailwind classes can be used but might not match exactly.
  // Converting as close as possible with Tailwind: `shadow-lg shadow-black/40 elevation-8`
  
  return (
    <View 
      className="absolute bottom-5 left-4 right-4 h-[72px] rounded-[36px] bg-[#141714] border-[0.8px] border-white/10 flex-row items-center justify-around px-2 shadow-lg shadow-black/40 elevation-8"
      style={Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      } : {}}
    >
      <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }} className="flex-1 items-center justify-center h-full" onPress={() => setCurrentTab('home')}>
        <Ionicons name="home-sharp" size={24} color={currentTab === 'home' ? '#2ecc71' : '#4a5e4c'} />
        <Text className={`text-[10px] mt-1 ${currentTab === 'home' ? 'text-[#2ecc71]' : 'text-[#4a5e4c]'}`}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }} className="flex-1 items-center justify-center h-full" onPress={() => setCurrentTab('transactions')}>
        <Ionicons name="list" size={24} color={currentTab === 'transactions' ? '#2ecc71' : '#4a5e4c'} />
        <Text className={`text-[10px] mt-1 ${currentTab === 'transactions' ? 'text-[#2ecc71]' : 'text-[#4a5e4c]'}`}>History</Text>
      </TouchableOpacity>
      
      <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }} className="flex-1 items-center justify-center h-full" onPress={() => setCurrentTab('inventory')}>
        <Ionicons name="grid" size={24} color={currentTab === 'inventory' ? '#2ecc71' : '#4a5e4c'} />
        <Text className={`text-[10px] mt-1 ${currentTab === 'inventory' ? 'text-[#2ecc71]' : 'text-[#4a5e4c]'}`}>Stock</Text>
      </TouchableOpacity>
      
      <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }} className="flex-1 items-center justify-center h-full" onPress={() => setCurrentTab('debtors')}>
        <Ionicons name="people" size={24} color={currentTab === 'debtors' ? '#2ecc71' : '#4a5e4c'} />
        <Text className={`text-[10px] mt-1 ${currentTab === 'debtors' ? 'text-[#2ecc71]' : 'text-[#4a5e4c]'}`}>Debts</Text>
      </TouchableOpacity>
      
      <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }} className="flex-1 items-center justify-center h-full" onPress={() => setCurrentTab('ai')}>
        <Ionicons name="sparkles" size={24} color={currentTab === 'ai' ? '#2ecc71' : '#4a5e4c'} />
        <Text className={`text-[10px] mt-1 ${currentTab === 'ai' ? 'text-[#2ecc71]' : 'text-[#4a5e4c]'}`}>Analyst</Text>
      </TouchableOpacity>
    </View>
  );
}
