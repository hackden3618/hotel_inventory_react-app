import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import { TakeoutSession } from '@/database/db';

interface HomeScreenProps {
  setActiveOverlay: (overlay: 'record-sale' | 'record-expense' | 'record-purchase' | 'ledger' | 'settings' | 'notifications' | 'dispatch-takeout' | null) => void;
  setActiveReconcileSession: (session: TakeoutSession | null) => void;
}

export default function HomeScreen({ setActiveOverlay, setActiveReconcileSession }: HomeScreenProps) {
  const { transactions, meals, takeoutSessions } = useApp();

  // Compute stats for current day
  const todayTx = transactions.filter(t => {
    const txDate = new Date(t.date).toDateString();
    const now = new Date().toDateString();
    return txDate === now;
  });

  const totalSalesToday = todayTx
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashToday = todayTx
    .filter(t => t.type === 'sale' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const mpesaToday = todayTx
    .filter(t => t.type === 'sale' && t.paymentMethod === 'mpesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const creditToday = todayTx
    .filter(t => t.type === 'sale' && t.paymentMethod === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesToday = todayTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const purchasesToday = todayTx
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);

  const profitToday = Math.max(0, totalSalesToday - expensesToday - purchasesToday);

  // Stock counters
  const totalPreparedToday = meals.reduce((sum, m) => sum + m.stock, 0);
  const lowStockCount = meals.filter(m => m.stock <= m.lowAlert).length;

  const screenWidth = Dimensions.get('window').width;
  
  const chartData = [
    {
      name: "Profit",
      population: profitToday,
      color: "#3498db",
      legendFontColor: "#8a9e8c",
      legendFontSize: 11
    },
    {
      name: "Expenses",
      population: expensesToday,
      color: "#f39c12",
      legendFontColor: "#8a9e8c",
      legendFontSize: 11
    },
    {
      name: "Purchases",
      population: purchasesToday,
      color: "#9b59b6",
      legendFontColor: "#8a9e8c",
      legendFontSize: 11
    },
    {
      name: "Debts",
      population: creditToday,
      color: "#e74c3c",
      legendFontColor: "#8a9e8c",
      legendFontSize: 11
    }
  ].filter(d => d.population > 0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Total Sales Card */}
      <View className="bg-[#2ecc71]/5 border-[0.5px] border-[#2ecc71]/20 rounded-[14px] p-4 mb-3">
        <Text className="text-[11px] text-[#8a9e8c] uppercase tracking-[0.5px]">Total Sales Today</Text>
        <Text className="text-[26px] font-bold text-[#f0f4f0] my-1">KES {totalSalesToday.toLocaleString()}</Text>
        
        <View className="flex-row justify-between mt-3 border-t-[0.5px] border-white/5 pt-3">
          <View>
            <Text className="text-[10px] text-[#8a9e8c] mb-[2px]">Cash in Hand</Text>
            <Text className="text-[12px] font-bold text-[#f0f4f0]">KES {cashToday.toLocaleString()}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-[#8a9e8c] mb-[2px]">M-Pesa</Text>
            <Text className="text-[12px] font-bold text-[#f0f4f0]">KES {mpesaToday.toLocaleString()}</Text>
          </View>
          <View>
            <Text className="text-[10px] text-[#8a9e8c] mb-[2px]">Margin</Text>
            <Text className="text-[12px] font-bold text-[#2ecc71]">KES {profitToday.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Dashboard Quick Stats */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <View className="flex-1 min-w-[45%] bg-[#141714] border-[0.5px] border-white/5 rounded-[10px] p-3">
          <Text className="text-[16px] font-bold mb-[2px] text-[#2ecc71]">{totalPreparedToday}</Text>
          <Text className="text-[10px] text-[#8a9e8c]">Meals Prepared</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-[#141714] border-[0.5px] border-white/5 rounded-[10px] p-3">
          <Text className="text-[16px] font-bold mb-[2px] text-[#f39c12]">{lowStockCount}</Text>
          <Text className="text-[10px] text-[#8a9e8c]">Alert Thresholds</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-[#141714] border-[0.5px] border-white/5 rounded-[10px] p-3">
          <Text className="text-[16px] font-bold mb-[2px] text-[#e74c3c]">KES {creditToday.toLocaleString()}</Text>
          <Text className="text-[10px] text-[#8a9e8c]">On Credit</Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-[#141714] border-[0.5px] border-white/5 rounded-[10px] p-3">
          <Text className="text-[16px] font-bold mb-[2px] text-[#3498db]">KES {expensesToday.toLocaleString()}</Text>
          <Text className="text-[10px] text-[#8a9e8c]">Expenses</Text>
        </View>
      </View>

      {/* Dynamic Summary Chart */}
      <View className="bg-[#141714] border-[0.5px] border-white/5 rounded-[14px] p-[14px] mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px]">TODAY'S RATIOS</Text>
          <Text className="text-[9px] py-0.5 px-2 rounded-[10px] bg-[#2ecc71]/10 text-[#2ecc71] font-bold">Real-time</Text>
        </View>
        
        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={screenWidth - 60}
            height={140}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"}
            center={[10, 0]}
            absolute
          />
        ) : (
          <View className="h-[140px] items-center justify-center">
            <Text className="text-[11px] text-[#4a5e4c] italic">No data yet for today.</Text>
          </View>
        )}
      </View>

      {/* Quick action buttons */}
      <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-4 mb-2">QUICK ACTIONS</Text>
      <View className="flex-row gap-2">
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#2ecc71] py-3 rounded-[10px] gap-1.5" onPress={() => setActiveOverlay('record-sale')}>
          <Ionicons name="receipt-outline" size={16} color="#0d1a12" />
          <Text className="text-[12px] font-bold text-[#0d1a12]">Record Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1c201b] border-[0.5px] border-white/10 py-3 rounded-[10px] gap-1.5" onPress={() => setActiveOverlay('record-expense')}>
          <Ionicons name="trending-down-outline" size={16} color="#f0f4f0" />
          <Text className="text-[12px] font-bold text-[#f0f4f0]">Log Expense</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1c201b] border-[0.5px] border-white/10 py-3 rounded-[10px] gap-1.5" onPress={() => setActiveOverlay('ledger')}>
          <Ionicons name="book-outline" size={16} color="#f0f4f0" />
          <Text className="text-[12px] font-bold text-[#f0f4f0]">View Ledger</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#1c201b] border-[0.5px] border-white/10 py-3 rounded-[10px] gap-1.5" onPress={() => setActiveOverlay('record-purchase')}>
          <Ionicons name="cart-outline" size={16} color="#f0f4f0" />
          <Text className="text-[12px] font-bold text-[#f0f4f0]">Restock / Purchase</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-2">
        <TouchableOpacity className="w-full flex-row items-center justify-center bg-[#1c201b] border-[0.5px] border-[#2ecc71]/30 py-3 rounded-[10px] gap-1.5" onPress={() => setActiveOverlay('dispatch-takeout')}>
          <Ionicons name="bicycle-outline" size={16} color="#2ecc71" />
          <Text className="text-[12px] font-bold text-[#2ecc71]">Dispatch Takeout (Outside Catering)</Text>
        </TouchableOpacity>
      </View>

      {/* Active Takeouts */}
      {takeoutSessions && takeoutSessions.length > 0 && (
        <>
          <Text className="text-[10px] font-bold text-[#f39c12] tracking-[0.8px] mt-4 mb-2">ACTIVE TAKEOUTS</Text>
          <View className="mb-1">
            {takeoutSessions.map((session, idx) => {
              const itemsCount = JSON.parse(session.dispatchedItems).reduce((s: number, i: any) => s + i.qty, 0);
              return (
                <TouchableOpacity 
                  key={session.id} 
                  className="flex-row items-center justify-between bg-[#f39c12]/10 border-[0.5px] border-[#f39c12]/30 p-3 rounded-[10px] mb-2"
                  onPress={() => setActiveReconcileSession(session)}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-[#f39c12]/20 items-center justify-center">
                      <Ionicons name="bicycle" size={16} color="#f39c12" />
                    </View>
                    <View>
                      <Text className="text-[13px] font-bold text-[#f0f4f0]">{session.staffName}</Text>
                      <Text className="text-[10px] text-[#8a9e8c] mt-[1px]">{itemsCount} items dispatched</Text>
                    </View>
                  </View>
                  <View className="bg-[#f39c12] px-3 py-1.5 rounded-[6px]">
                    <Text className="text-[10px] font-bold text-[#0d1a12]">Reconcile</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Recent activity list */}
      <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-4 mb-2">RECENT ACTIVITY</Text>
      <View className="mb-3">
        {transactions.slice(0, 4).map((tx, idx) => {
          const isExpense = tx.type === 'expense' || tx.type === 'purchase';
          const txColor = tx.type === 'sale' ? '#2ecc71' : tx.type === 'takeaway' || tx.type === 'consumed' ? '#f39c12' : '#e74c3c';
          const amtSign = isExpense ? '-' : '+';
          
          return (
            <View key={idx} className="flex-row items-center py-2.5 border-b-[0.5px] border-white/5 gap-[10px]">
              <View className={`w-8 h-8 rounded-2xl items-center justify-center ${isExpense ? 'bg-[#e74c3c]/10' : 'bg-[#2ecc71]/10'}`}>
                <Ionicons name={isExpense ? "trending-down" : "trending-up"} size={16} color={isExpense ? "#e74c3c" : "#2ecc71"} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-medium text-[#f0f4f0]">{tx.title}</Text>
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
