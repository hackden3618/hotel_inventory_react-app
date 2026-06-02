import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';

// Import Screens
import HomeScreen from '@/components/screens/HomeScreen';
import TransactionsScreen from '@/components/screens/TransactionsScreen';
import InventoryScreen from '@/components/screens/InventoryScreen';
import DebtorsScreen from '@/components/screens/DebtorsScreen';
import AiAnalystScreen from '@/components/screens/AiAnalystScreen';

// Import Modals
import RecordSaleModal from '@/components/modals/RecordSaleModal';
import RecordExpenseModal from '@/components/modals/RecordExpenseModal';
import RecordPurchaseModal from '@/components/modals/RecordPurchaseModal';
import LedgerModal from '@/components/modals/LedgerModal';
import NotificationsModal from '@/components/modals/NotificationsModal';
import SettingsModal from '@/components/modals/SettingsModal';
import AddMealModal from '@/components/modals/AddMealModal';
import AddInventoryModal from '@/components/modals/AddInventoryModal';
import PaymentModal from '@/components/modals/PaymentModal';
import DispatchTakeoutModal from '@/components/modals/DispatchTakeoutModal';
import ReconcileTakeoutModal from '@/components/modals/ReconcileTakeoutModal';
import { TakeoutSession, Meal, InventoryItem } from '@/database/db';

// Import UI
import FloatingTabBar from '@/components/ui/FloatingTabBar';

type TabName = 'home' | 'transactions' | 'inventory' | 'debtors' | 'ai';
type OverlayName = 'record-sale' | 'record-expense' | 'record-purchase' | 'ledger' | 'settings' | 'notifications' | 'dispatch-takeout' | null;

export default function Index() {
  const { businessName, unreadNotifsCount } = useApp();
  
  // App State
  const [currentTab, setCurrentTab] = useState<TabName>('home');
  const [activeOverlay, setActiveOverlay] = useState<OverlayName>(null);
  
  // Modal specific state
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | undefined>(undefined);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | undefined>(undefined);
  const [debtorTab, setDebtorTab] = useState<'debtors' | 'creditors'>('debtors');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [creditorPayModalVisible, setCreditorPayModalVisible] = useState(false);
  const [selectedDebtorName, setSelectedDebtorName] = useState('');
  const [selectedCreditorName, setSelectedCreditorName] = useState('');
  const [activeReconcileSession, setActiveReconcileSession] = useState<TakeoutSession | null>(null);

  // Greeting
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      {/* HEADER SECTION */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
        <View>
          <Text className="text-[12px] font-bold text-[#8a9e8c] tracking-[0.5px] uppercase">{greeting}</Text>
          <Text className="text-[20px] font-bold text-[#f0f4f0]">{businessName}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            className="w-10 h-10 rounded-[14px] bg-[#141714] border-[0.5px] border-white/5 items-center justify-center relative"
            onPress={() => setActiveOverlay('notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#8a9e8c" />
            {unreadNotifsCount > 0 && (
              <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#e74c3c]" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 rounded-[14px] bg-[#2ecc71]/10 border-[0.5px] border-[#2ecc71]/20 items-center justify-center"
            onPress={() => setActiveOverlay('settings')}
          >
            <Text className="text-[14px] font-bold text-[#2ecc71]">
              {businessName.substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CORE VIEWPORT */}
      <View className="flex-1 px-4 pt-2 pb-24">
        {currentTab === 'home' && <HomeScreen setActiveOverlay={setActiveOverlay} setActiveReconcileSession={setActiveReconcileSession} />}
        {currentTab === 'transactions' && <TransactionsScreen />}
        {currentTab === 'inventory' && (
          <InventoryScreen 
            setMealModalVisible={(v) => { setMealModalVisible(v); if (!v) setEditingMeal(undefined); }} 
            setInventoryModalVisible={(v) => { setInventoryModalVisible(v); if (!v) setEditingInventoryItem(undefined); }} 
            setEditingMeal={setEditingMeal}
            setEditingInventoryItem={setEditingInventoryItem}
          />
        )}
        {currentTab === 'debtors' && (
          <DebtorsScreen 
            debtorTab={debtorTab}
            setDebtorTab={setDebtorTab}
            setSelectedDebtorName={setSelectedDebtorName}
            setPaymentModalVisible={setPaymentModalVisible}
            setSelectedCreditorName={setSelectedCreditorName}
            setCreditorPayModalVisible={setCreditorPayModalVisible}
          />
        )}
        {currentTab === 'ai' && <AiAnalystScreen />}
      </View>

      {/* FLOATING TAB BAR */}
      <FloatingTabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* CONDITIONALLY MOUNTED MODALS */}
      {activeOverlay === 'record-sale' && <RecordSaleModal visible onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'record-expense' && <RecordExpenseModal visible onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'record-purchase' && <RecordPurchaseModal visible onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'ledger' && <LedgerModal visible onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'notifications' && <NotificationsModal visible onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'settings' && <SettingsModal visible onClose={() => setActiveOverlay(null)} />}
      
      {/* Component-Specific Modals */}
      {mealModalVisible && <AddMealModal visible onClose={() => { setMealModalVisible(false); setEditingMeal(undefined); }} editingMeal={editingMeal} />}
      {inventoryModalVisible && <AddInventoryModal visible onClose={() => { setInventoryModalVisible(false); setEditingInventoryItem(undefined); }} editingItem={editingInventoryItem} />}
      {paymentModalVisible && <PaymentModal visible onClose={() => setPaymentModalVisible(false)} type="debtor" personName={selectedDebtorName} />}
      {creditorPayModalVisible && <PaymentModal visible onClose={() => setCreditorPayModalVisible(false)} type="creditor" personName={selectedCreditorName} />}
      {activeOverlay === 'dispatch-takeout' && <DispatchTakeoutModal visible onClose={() => setActiveOverlay(null)} />}
      {activeReconcileSession !== null && <ReconcileTakeoutModal visible onClose={() => setActiveReconcileSession(null)} session={activeReconcileSession} />}
    </SafeAreaView>
  );
}