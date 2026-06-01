import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useApp } from '@/database/AppContext';
import { Meal, Transaction, Debtor, Creditor, Notification } from '@/database/db';
import { generateLedgerPDF } from '@/utils/pdfGenerator';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const {
    businessName,
    meals,
    transactions,
    debtors,
    creditors,
    notifications,
    unreadNotifsCount,
    reportPeriod,
    setReportPeriod,
    saveBusinessName,
    recordSale,
    recordExpense,
    recordPurchase,
    recordDebtorPayment,
    recordCreditorPayment,
    clearDebtorAccount,
    addNewMeal,
    clearAllNotifs
  } = useApp();

  // Navigation state: 'home' | 'transactions' | 'inventory' | 'debtors' | 'ai'
  const [currentTab, setCurrentTab] = useState<'home' | 'transactions' | 'inventory' | 'debtors' | 'ai'>('home');

  // Sub-screen overlays / actions
  const [activeOverlay, setActiveOverlay] = useState<null | 'record-sale' | 'record-expense' | 'record-purchase' | 'ledger' | 'settings' | 'notifications'>(null);

  // Search/Filter states
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'sale' | 'credit' | 'takeaway' | 'expense' | 'purchase'>('all');
  const [invSearch, setInvSearch] = useState('');
  const [debtorTab, setDebtorTab] = useState<'debtors' | 'creditors'>('debtors');

  // Add Meal Modal
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealPrice, setNewMealPrice] = useState('');
  const [newMealStock, setNewMealStock] = useState('');
  const [newMealAlert, setNewMealAlert] = useState('');
  const [newMealEmoji, setNewMealEmoji] = useState('🫓');

  // Add Expense Form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayMethod, setExpensePayMethod] = useState<'cash' | 'mpesa'>('cash');

  // Add Purchase Form
  const [purchaseTitle, setPurchaseTitle] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseCredited, setPurchaseCredited] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState('');

  // Record Debtor Payment Form
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedDebtorName, setSelectedDebtorName] = useState('');
  const [debtorPayAmount, setDebtorPayAmount] = useState('');
  const [debtorPayMethod, setDebtorPayMethod] = useState<'cash' | 'mpesa'>('cash');

  // Record Creditor Payment Form
  const [creditorPayModalVisible, setCreditorPayModalVisible] = useState(false);
  const [selectedCreditorName, setSelectedCreditorName] = useState('');
  const [creditorPayAmount, setCreditorPayAmount] = useState('');

  // Record Sale Form State
  const [selectedSaleItems, setSelectedSaleItems] = useState<{ [mealId: number]: number }>({});
  const [saleType, setSaleType] = useState<'dinein' | 'takeaway' | 'credit' | 'consumed'>('dinein');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'cash' | 'mpesa' | 'credit' | 'none'>('cash');
  const [saleReferenceName, setSaleReferenceName] = useState('');

  // Business Name Config State
  const [tempBusinessName, setTempBusinessName] = useState(businessName);

  // AI Chat States
  const [aiChat, setAiChat] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: "Welcome to your financial dashboard. Ask me any question about your stock levels, daily margins, or debtor list." }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Greetings logic
  const [greeting, setGreeting] = useState('Welcome');
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning ☕');
    else if (hr < 17) setGreeting('Good afternoon ☀️');
    else setGreeting('Good evening 🌙');
  }, []);

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

  const profitToday = Math.max(0, totalSalesToday - expensesToday);

  // Stock counters
  const totalPreparedToday = meals.reduce((sum, m) => sum + m.stock, 0);
  const lowStockCount = meals.filter(m => m.stock <= m.lowAlert).length;

  // AI query matching mock analyst responses based on sqlite data
  const handleAISubmit = () => {
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiChat(prev => [...prev, { sender: 'user', text: userText }]);
    setAiInput('');
    setAiLoading(true);

    setTimeout(() => {
      let botResponse = "I have analyzed Wambu's corner hotel records. ";
      const cleanText = userText.toLowerCase();

      if (cleanText.includes('profit') || cleanText.includes('margin') || cleanText.includes('sales')) {
        botResponse += `Today's total sales are KES ${totalSalesToday.toLocaleString()} (${(cashToday / (totalSalesToday || 1) * 100).toFixed(0)}% cash, ${(mpesaToday / (totalSalesToday || 1) * 100).toFixed(0)}% mobile money). After factoring KES ${expensesToday.toLocaleString()} in daily expenses, the current margin is KES ${profitToday.toLocaleString()}.`;
      } else if (cleanText.includes('debt') || cleanText.includes('debtor') || cleanText.includes('owe')) {
        const totalDebtorsOwed = debtors.reduce((sum, d) => sum + (d.totalOwed - d.totalPaid), 0);
        botResponse += `You currently have ${debtors.length} active debtor entries. The total outstanding credit is KES ${totalDebtorsOwed.toLocaleString()}. John is your largest pending collection.`;
      } else if (cleanText.includes('stock') || cleanText.includes('chapati') || cleanText.includes('alert')) {
        const lowMeals = meals.filter(m => m.stock <= m.lowAlert).map(m => m.name);
        if (lowMeals.length > 0) {
          botResponse += `Inventory alert: ${lowMeals.join(', ')} stock levels are critically low. Recommended to restock immediately to avoid sell-outs.`;
        } else {
          botResponse += "All inventory streams are stable and above set thresholds. Current chapati reserves stand at " + (meals.find(m => m.name === 'Chapati')?.stock || 0) + ".";
        }
      } else {
        botResponse += `The operation is running steadily today with KES ${totalSalesToday.toLocaleString()} in sales. Debtor list has ${debtors.length} entries and there are ${lowStockCount} inventory alert warnings active. Let me know if you'd like a PDF statement.`;
      }

      setAiChat(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setAiLoading(false);
    }, 1000);
  };

  // Helper for generating period-specific values
  const getPeriodSummary = () => {
    // Basic filter according to selected period
    let filtered = transactions;
    const now = new Date();
    
    if (reportPeriod === 'today') {
      filtered = transactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
    } else if (reportPeriod === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
    } else if (reportPeriod === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
    } else if (reportPeriod === 'year') {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = transactions.filter(t => new Date(t.date) >= oneYearAgo);
    }

    const totalDr = filtered
      .filter(t => t.type === 'expense' || t.type === 'purchase' || t.type === 'takeaway' || t.type === 'consumed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCr = filtered
      .filter(t => t.type === 'sale' || t.type === 'debtor_payment' || t.type === 'creditor_payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const openingBalance = 850200; // Simulated carry over base
    const trialBalance = openingBalance + totalCr - totalDr;

    return { totalDr, totalCr, openingBalance, trialBalance, filtered };
  };

  const periodSummary = getPeriodSummary();

  const handleRecordSaleSave = () => {
    const saleItems = Object.entries(selectedSaleItems)
      .filter(([_, qty]) => qty > 0)
      .map(([mealIdStr, qty]) => {
        const mealId = parseInt(mealIdStr);
        const m = meals.find(x => x.id === mealId)!;
        return {
          mealId,
          name: m.name,
          qty,
          price: m.price
        };
      });

    if (saleItems.length === 0) {
      Alert.alert('Empty Cart', 'Select at least one meal and specify the quantity.');
      return;
    }

    if (saleType === 'credit' && !saleReferenceName.trim()) {
      Alert.alert('Missing Customer Name', 'Specify the debtor name.');
      return;
    }

    if (saleType === 'takeaway' && !saleReferenceName.trim()) {
      Alert.alert('Missing Handler Name', 'Specify who is taking out the meals.');
      return;
    }

    // Call Context to save
    recordSale(
      saleItems,
      saleType,
      saleType === 'credit' ? 'credit' : saleType === 'consumed' ? 'none' : salePaymentMethod,
      saleReferenceName
    );

    // Reset Form
    setSelectedSaleItems({});
    setSaleReferenceName('');
    setActiveOverlay(null);
    Alert.alert('Transaction Successful', 'Recorded offline in database.');
  };

  const handleAddMealSave = () => {
    if (!newMealName || !newMealPrice || !newMealStock) {
      Alert.alert('Validation Error', 'Please fill in meal name, price and opening stock.');
      return;
    }

    addNewMeal(
      newMealName,
      parseFloat(newMealPrice),
      parseInt(newMealStock),
      parseInt(newMealAlert) || 10,
      newMealEmoji
    );

    setNewMealName('');
    setNewMealPrice('');
    setNewMealStock('');
    setNewMealAlert('');
    setMealModalVisible(false);
  };

  const handleRecordExpenseSave = () => {
    if (!expenseTitle || !expenseAmount) {
      Alert.alert('Validation Error', 'Fill in description and amount.');
      return;
    }
    recordExpense(expenseTitle, parseFloat(expenseAmount), expensePayMethod);
    setExpenseTitle('');
    setExpenseAmount('');
    setActiveOverlay(null);
    Alert.alert('Expense Logged', 'Transaction compiled.');
  };

  const handleRecordPurchaseSave = () => {
    if (!purchaseTitle || !purchaseAmount || (purchaseCredited && !purchaseSupplier)) {
      Alert.alert('Validation Error', 'Please complete all fields correctly.');
      return;
    }
    recordPurchase(purchaseTitle, parseFloat(purchaseAmount), purchaseCredited, purchaseSupplier || 'General Vendor');
    setPurchaseTitle('');
    setPurchaseAmount('');
    setPurchaseSupplier('');
    setPurchaseCredited(false);
    setActiveOverlay(null);
    Alert.alert('Restock Logged', 'Purchase recorded.');
  };

  const handleDebtorPaymentSave = () => {
    if (!debtorPayAmount || parseFloat(debtorPayAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid collection amount.');
      return;
    }
    recordDebtorPayment(selectedDebtorName, parseFloat(debtorPayAmount), debtorPayMethod);
    setDebtorPayAmount('');
    setPaymentModalVisible(false);
  };

  const handleCreditorPaymentSave = () => {
    if (!creditorPayAmount || parseFloat(creditorPayAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Enter valid remittance.');
      return;
    }
    recordCreditorPayment(selectedCreditorName, parseFloat(creditorPayAmount));
    setCreditorPayAmount('');
    setCreditorPayModalVisible(false);
  };

  const triggerPDFReport = async () => {
    const s = periodSummary;
    let periodText = '1 - 31 Oct';
    if (reportPeriod === 'today') periodText = 'Today';
    else if (reportPeriod === 'week') periodText = 'This Week';
    else if (reportPeriod === 'year') periodText = 'This Year';
    else if (reportPeriod === 'all') periodText = 'All-Time';

    await generateLedgerPDF(
      businessName,
      s.filtered,
      debtors,
      creditors,
      periodText,
      {
        totalDr: s.totalDr,
        totalCr: s.totalCr,
        openingBalance: s.openingBalance,
        trialBalance: s.trialBalance
      }
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.businessTitle}>{businessName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActiveOverlay('notifications')}>
            <Ionicons name="notifications-outline" size={20} color="#8a9e8c" />
            {unreadNotifsCount > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => setActiveOverlay('settings')}>
            <Text style={styles.avatarText}>{businessName.substring(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CORE VIEWPORT */}
      <ScrollView contentContainerStyle={styles.viewPortScroll} showsVerticalScrollIndicator={false}>
        
        {/* VIEW 1: HOME/DASHBOARD */}
        {currentTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Total Sales Card */}
            <View style={styles.salesCard}>
              <Text style={styles.salesLabel}>Total Sales Today</Text>
              <Text style={styles.salesAmount}>KES {totalSalesToday.toLocaleString()}</Text>
              
              <View style={styles.salesBreakdown}>
                <View>
                  <Text style={styles.breakdownLabel}>Cash in Hand</Text>
                  <Text style={styles.breakdownVal}>KES {cashToday.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>M-Pesa</Text>
                  <Text style={styles.breakdownVal}>KES {mpesaToday.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Margin</Text>
                  <Text style={[styles.breakdownVal, { color: '#2ecc71' }]}>KES {profitToday.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Dashboard Quick Stats */}
            <View style={styles.gridContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#2ecc71' }]}>{totalPreparedToday}</Text>
                <Text style={styles.statLabel}>Meals Prepared</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#f39c12' }]}>{lowStockCount}</Text>
                <Text style={styles.statLabel}>Alert Thresholds</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#e74c3c' }]}>KES {creditToday.toLocaleString()}</Text>
                <Text style={styles.statLabel}>On Credit</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#3498db' }]}>KES {expensesToday.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
              </View>
            </View>

            {/* Weekly Summary Chart */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>WEEKLY OVERVIEW</Text>
                <Text style={styles.pillBadge}>This Week</Text>
              </View>
              {/* Responsive Pure CSS/SVG Chart Columns */}
              <View style={styles.chartContainer}>
                {[
                  { d: 'Mon', h: 32, type: 'sale' },
                  { d: 'Tue', h: 48, type: 'sale' },
                  { d: 'Wed', h: 28, type: 'sale' },
                  { d: 'Thu', h: 56, type: 'sale' },
                  { d: 'Fri', h: 60, type: 'sale' },
                  { d: 'Sat', h: 18, type: 'exp' },
                  { d: 'Sun', h: 10, type: 'profit' }
                ].map((bar, i) => (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        { height: bar.h },
                        bar.type === 'exp' ? { backgroundColor: '#f39c12' } : bar.type === 'profit' ? { backgroundColor: '#3498db' } : { backgroundColor: '#2ecc71' }
                      ]} />
                    </View>
                    <Text style={styles.barLabel}>{bar.d}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegends}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                  <Text style={styles.legendText}>Sales</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
                  <Text style={styles.legendText}>Profit</Text>
                </View>
              </View>
            </View>

            {/* Quick action buttons */}
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setActiveOverlay('record-sale')}>
                <Ionicons name="receipt-outline" size={16} color="#0d1a12" />
                <Text style={styles.actionBtnTextPrimary}>Record Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setActiveOverlay('record-expense')}>
                <Ionicons name="trending-down-outline" size={16} color="#f0f4f0" />
                <Text style={styles.actionBtnTextSecondary}>Log Expense</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.actionRow, { marginTop: 8 }]}>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setActiveOverlay('ledger')}>
                <Ionicons name="book-outline" size={16} color="#f0f4f0" />
                <Text style={styles.actionBtnTextSecondary}>View Ledger</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setActiveOverlay('record-purchase')}>
                <Ionicons name="cart-outline" size={16} color="#f0f4f0" />
                <Text style={styles.actionBtnTextSecondary}>Restock / Purchase</Text>
              </TouchableOpacity>
            </View>

            {/* Recent activity list */}
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <View style={{ marginBottom: 12 }}>
              {transactions.slice(0, 4).map((tx, idx) => {
                const isExpense = tx.type === 'expense' || tx.type === 'purchase';
                const txColor = tx.type === 'sale' ? '#2ecc71' : tx.type === 'takeaway' || tx.type === 'consumed' ? '#f39c12' : '#e74c3c';
                const amtSign = isExpense ? '-' : '+';
                
                return (
                  <View key={idx} style={styles.activityItem}>
                    <View style={[styles.activityIconWrap, { backgroundColor: isExpense ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)' }]}>
                      <Ionicons name={isExpense ? "trending-down" : "trending-up"} size={16} color={isExpense ? "#e74c3c" : "#2ecc71"} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{tx.title}</Text>
                      <Text style={styles.activityDetails}>{tx.description}</Text>
                    </View>
                    <Text style={[styles.activityAmount, { color: txColor }]}>
                      {tx.type === 'takeaway' || tx.type === 'consumed' ? 'Flow' : `${amtSign}KES ${tx.amount.toLocaleString()}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* VIEW 2: TRANSACTIONS LIST */}
        {currentTab === 'transactions' && (
          <View style={styles.tabContent}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#8a9e8c" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search history..."
                placeholderTextColor="#4a5e4c"
                value={txSearch}
                onChangeText={setTxSearch}
              />
            </View>

            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
              {['all', 'sale', 'credit', 'takeaway', 'expense', 'purchase'].map((filter, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pill, txFilter === filter && styles.pillActive]}
                  onPress={() => setTxFilter(filter as any)}
                >
                  <Text style={[styles.pillText, txFilter === filter && styles.pillTextActive]}>
                    {filter.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Transactions lists */}
            <View style={{ marginTop: 8 }}>
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
                    <View key={idx} style={styles.activityItem}>
                      <View style={[styles.activityIconWrap, { backgroundColor: isExpense ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)' }]}>
                        <Ionicons name={isExpense ? "trending-down" : "trending-up"} size={16} color={isExpense ? "#e74c3c" : "#2ecc71"} />
                      </View>
                      <View style={styles.activityInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.activityName}>{tx.title}</Text>
                          <Text style={styles.txDateBadge}>{date}</Text>
                        </View>
                        <Text style={styles.activityDetails}>{tx.description}</Text>
                      </View>
                      <Text style={[styles.activityAmount, { color: txColor }]}>
                        {tx.type === 'takeaway' || tx.type === 'consumed' ? 'Flow' : `${amtSign}KES ${tx.amount.toLocaleString()}`}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* VIEW 3: INVENTORY */}
        {currentTab === 'inventory' && (
          <View style={styles.tabContent}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#8a9e8c" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stock..."
                placeholderTextColor="#4a5e4c"
                value={invSearch}
                onChangeText={setInvSearch}
              />
            </View>

            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>MENU STOCK LEVELS</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setMealModalVisible(true)}>
                <Ionicons name="add" size={18} color="#0d1a12" />
                <Text style={styles.addButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>

            {meals
              .filter(m => m.name.toLowerCase().includes(invSearch.toLowerCase()))
              .map((meal, idx) => {
                const stockPercentage = Math.min(100, (meal.stock / 210) * 100);
                const isLow = meal.stock <= meal.lowAlert;

                return (
                  <View key={idx} style={styles.mealStockItem}>
                    <View style={styles.mealIconWrapper}>
                      <Text style={styles.mealIconText}>{meal.image || '🫓'}</Text>
                    </View>
                    <View style={styles.mealStockInfo}>
                      <View style={styles.mealStockNameRow}>
                        <Text style={styles.mealStockName}>{meal.name}</Text>
                        <Text style={[styles.mealStockQty, isLow && { color: '#e74c3c' }]}>
                          {meal.stock} available
                        </Text>
                      </View>
                      <Text style={styles.mealStockPrice}>KES {meal.price} per unit · Alert at {meal.lowAlert}</Text>
                      <View style={styles.progressBarBg}>
                        <View style={[
                          styles.progressBarFill,
                          { width: `${stockPercentage}%` },
                          isLow ? { backgroundColor: '#e74c3c' } : { backgroundColor: '#2ecc71' }
                        ]} />
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* VIEW 4: DEBTORS & CREDITORS */}
        {currentTab === 'debtors' && (
          <View style={styles.tabContent}>
            <View style={styles.debtorCreditorTabContainer}>
              <TouchableOpacity
                style={[styles.dcTab, debtorTab === 'debtors' && styles.dcTabActive]}
                onPress={() => setDebtorTab('debtors')}
              >
                <Text style={[styles.dcTabText, debtorTab === 'debtors' && styles.dcTabTextActive]}>Debtors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dcTab, debtorTab === 'creditors' && styles.dcTabActive]}
                onPress={() => setDebtorTab('creditors')}
              >
                <Text style={[styles.dcTabText, debtorTab === 'creditors' && styles.dcTabTextActive]}>Creditors</Text>
              </TouchableOpacity>
            </View>

            {debtorTab === 'debtors' ? (
              <View>
                {debtors.map((debtor, idx) => {
                  const outstanding = debtor.totalOwed - debtor.totalPaid;
                  if (outstanding <= 0) return null;

                  return (
                    <View key={idx} style={styles.debtorCard}>
                      <View style={styles.debtorHeader}>
                        <View style={styles.debtorInfoCol}>
                          <Text style={styles.debtorName}>{debtor.name}</Text>
                          <Text style={styles.debtorLastActivity}>Owed since: {new Date(debtor.lastUpdated).toLocaleDateString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.debtorOwedAmount}>KES {outstanding.toLocaleString()}</Text>
                          <Text style={styles.debtorOwedLabel}>Outstanding Balance</Text>
                        </View>
                      </View>

                      <View style={styles.debtorStatsRow}>
                        <Text style={styles.debtorStatsText}>Owed: KES {debtor.totalOwed.toLocaleString()}</Text>
                        <Text style={[styles.debtorStatsText, { color: '#2ecc71' }]}>Paid: KES {debtor.totalPaid.toLocaleString()}</Text>
                      </View>

                      <View style={styles.debtorActionsRow}>
                        <TouchableOpacity style={styles.debtorActionPayBtn} onPress={() => {
                          setSelectedDebtorName(debtor.name);
                          setPaymentModalVisible(true);
                        }}>
                          <Text style={styles.debtorActionPayText}>Record Payment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.debtorActionClearBtn} onPress={() => clearDebtorAccount(debtor.id)}>
                          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                {creditors.map((creditor, idx) => {
                  const outstanding = creditor.totalOwed - creditor.totalPaid;
                  if (outstanding <= 0) return null;

                  return (
                    <View key={idx} style={styles.debtorCard}>
                      <View style={styles.debtorHeader}>
                        <View style={styles.debtorInfoCol}>
                          <Text style={styles.debtorName}>{creditor.name}</Text>
                          <Text style={styles.debtorLastActivity}>Purchase date: {new Date(creditor.lastUpdated).toLocaleDateString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.debtorOwedAmount, { color: '#f39c12' }]}>KES {outstanding.toLocaleString()}</Text>
                          <Text style={styles.debtorOwedLabel}>Outstanding Balance</Text>
                        </View>
                      </View>

                      <View style={styles.debtorActionsRow}>
                        <TouchableOpacity style={[styles.debtorActionPayBtn, { backgroundColor: '#f39c12' }]} onPress={() => {
                          setSelectedCreditorName(creditor.name);
                          setCreditorPayModalVisible(true);
                        }}>
                          <Text style={styles.debtorActionPayText}>Record Partial Payment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* VIEW 5: AI ANALYST */}
        {currentTab === 'ai' && (
          <View style={styles.tabContent}>
            <View style={styles.aiChatArea}>
              {aiChat.map((msg, i) => (
                <View key={i} style={[styles.aiMessageBubble, msg.sender === 'user' ? styles.aiUserBubble : styles.aiBotBubble]}>
                  <Text style={[styles.aiMessageText, msg.sender === 'user' ? { color: '#0d1a12' } : { color: '#f0f4f0' }]}>{msg.text}</Text>
                </View>
              ))}
              {aiLoading && <ActivityIndicator size="small" color="#2ecc71" style={{ marginVertical: 8, alignSelf: 'flex-start' }} />}
            </View>

            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiTextInput}
                placeholder="Ask about margin, debtors or inventory..."
                placeholderTextColor="#4a5e4c"
                value={aiInput}
                onChangeText={setAiInput}
              />
              <TouchableOpacity style={styles.aiSendBtn} onPress={handleAISubmit}>
                <Ionicons name="send" size={16} color="#0d1a12" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING BOT NAV */}
      <View style={styles.floatingTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('home')}>
          <Ionicons name="home-sharp" size={20} color={currentTab === 'home' ? '#2ecc71' : '#4a5e4c'} />
          <Text style={[styles.tabItemText, currentTab === 'home' && { color: '#2ecc71' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('transactions')}>
          <Ionicons name="list" size={20} color={currentTab === 'transactions' ? '#2ecc71' : '#4a5e4c'} />
          <Text style={[styles.tabItemText, currentTab === 'transactions' && { color: '#2ecc71' }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('inventory')}>
          <Ionicons name="grid" size={20} color={currentTab === 'inventory' ? '#2ecc71' : '#4a5e4c'} />
          <Text style={[styles.tabItemText, currentTab === 'inventory' && { color: '#2ecc71' }]}>Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('debtors')}>
          <Ionicons name="people" size={20} color={currentTab === 'debtors' ? '#2ecc71' : '#4a5e4c'} />
          <Text style={[styles.tabItemText, currentTab === 'debtors' && { color: '#2ecc71' }]}>Debts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('ai')}>
          <Ionicons name="sparkles" size={20} color={currentTab === 'ai' ? '#2ecc71' : '#4a5e4c'} />
          <Text style={[styles.tabItemText, currentTab === 'ai' && { color: '#2ecc71' }]}>Analyst</Text>
        </TouchableOpacity>
      </View>

      {/* ================================================================ */}
      {/*                       OVERLAYS & MODALS                          */}
      {/* ================================================================ */}

      {/* OVERLAY: RECORD SALE */}
      <Modal visible={activeOverlay === 'record-sale'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Record New Sale</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>SELECT ITEMS & SPECIFY QUANTITY</Text>
              {meals.map((meal, index) => {
                const currentQty = selectedSaleItems[meal.id] || 0;
                return (
                  <View key={index} style={styles.saleItemRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 24, marginRight: 10 }}>{meal.image}</Text>
                      <View>
                        <Text style={styles.saleItemName}>{meal.name}</Text>
                        <Text style={styles.saleItemPrice}>KES {meal.price} each</Text>
                      </View>
                    </View>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => {
                        setSelectedSaleItems(prev => ({
                          ...prev,
                          [meal.id]: Math.max(0, currentQty - 1)
                        }));
                      }}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{currentQty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => {
                        setSelectedSaleItems(prev => ({
                          ...prev,
                          [meal.id]: currentQty + 1
                        }));
                      }}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <Text style={styles.fieldLabel}>SALE TYPE</Text>
              <View style={styles.tabSelector}>
                {['dinein', 'takeaway', 'credit', 'consumed'].map((type, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.tabSelectButton, saleType === type && styles.tabSelectButtonActive]}
                    onPress={() => setSaleType(type as any)}
                  >
                    <Text style={[styles.tabSelectText, saleType === type && styles.tabSelectTextActive]}>
                      {type === 'dinein' ? 'Dine-In' : type === 'takeaway' ? 'Take-Out' : type === 'credit' ? 'Credit' : 'Internal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Conditional parameters */}
              {saleType === 'credit' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>DEBTOR NAME</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter customer name..."
                    placeholderTextColor="#4a5e4c"
                    value={saleReferenceName}
                    onChangeText={setSaleReferenceName}
                  />
                </View>
              )}

              {saleType === 'takeaway' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TAKEN AWAY BY</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Customer or staff name..."
                    placeholderTextColor="#4a5e4c"
                    value={saleReferenceName}
                    onChangeText={setSaleReferenceName}
                  />
                </View>
              )}

              {saleType !== 'credit' && saleType !== 'consumed' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
                  <View style={styles.tabSelector}>
                    {['cash', 'mpesa'].map((method, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.tabSelectButton, salePaymentMethod === method && styles.tabSelectButtonActive]}
                        onPress={() => setSalePaymentMethod(method as any)}
                      >
                        <Text style={[styles.tabSelectText, salePaymentMethod === method && styles.tabSelectTextActive]}>
                          {method === 'cash' ? 'Cash' : 'M-Pesa'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Summary calculation card */}
              <View style={styles.summaryBreakdownCard}>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Selected Items Value</Text>
                  <Text style={styles.summaryItemVal}>
                    KES {Object.entries(selectedSaleItems).reduce((sum, [mid, qty]) => {
                      const m = meals.find(x => x.id === parseInt(mid));
                      return sum + (m ? m.price * qty : 0);
                    }, 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleRecordSaleSave}>
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* OVERLAY: RECORD EXPENSE */}
      <Modal visible={activeOverlay === 'record-expense'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Record Business Expense</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EXPENSE DESCRIPTION</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Supper bought, Charcoal..."
                placeholderTextColor="#4a5e4c"
                value={expenseTitle}
                onChangeText={setExpenseTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AMOUNT (KES)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PAYMENT ACCOUNT</Text>
              <View style={styles.tabSelector}>
                {['cash', 'mpesa'].map((method, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.tabSelectButton, expensePayMethod === method && styles.tabSelectButtonActive]}
                    onPress={() => setExpensePayMethod(method as any)}
                  >
                    <Text style={[styles.tabSelectText, expensePayMethod === method && styles.tabSelectTextActive]}>
                      {method === 'cash' ? 'Cash' : 'M-Pesa'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleRecordExpenseSave}>
              <Text style={styles.saveBtnText}>Save Expense</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* OVERLAY: RECORD PURCHASE */}
      <Modal visible={activeOverlay === 'record-purchase'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Record Purchase / Restock</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PURCHASE DETAIL</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Wheat Flour restock, Charcoal bag..."
                placeholderTextColor="#4a5e4c"
                value={purchaseTitle}
                onChangeText={setPurchaseTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AMOUNT (KES)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={purchaseAmount}
                onChangeText={setPurchaseAmount}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PURCHASE TYPE</Text>
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  style={[styles.tabSelectButton, !purchaseCredited && styles.tabSelectButtonActive]}
                  onPress={() => setPurchaseCredited(false)}
                >
                  <Text style={[styles.tabSelectText, !purchaseCredited && styles.tabSelectTextActive]}>Fully Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabSelectButton, purchaseCredited && styles.tabSelectButtonActive]}
                  onPress={() => setPurchaseCredited(true)}
                >
                  <Text style={[styles.tabSelectText, purchaseCredited && styles.tabSelectTextActive]}>On Credit</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{purchaseCredited ? 'CREDITOR / SUPPLIER' : 'SUPPLIER NAME'}</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Kamau Traders..."
                placeholderTextColor="#4a5e4c"
                value={purchaseSupplier}
                onChangeText={setPurchaseSupplier}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleRecordPurchaseSave}>
              <Text style={styles.saveBtnText}>Save Purchase</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* OVERLAY: LEDGER TABLE */}
      <Modal visible={activeOverlay === 'ledger'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <View style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Financial Ledger</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <View style={styles.periodRow}>
              {['today', 'week', 'month', 'year', 'all'].map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.periodPill, reportPeriod === p && styles.periodPillActive]}
                  onPress={() => setReportPeriod(p as any)}
                >
                  <Text style={[styles.periodPillText, reportPeriod === p && styles.periodPillTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryLedgerBoxes}>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#f39c12', fontSize: 13 }]}>KES {periodSummary.totalDr.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Debits (Dr)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#2ecc71', fontSize: 13 }]}>KES {periodSummary.totalCr.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Credits (Cr)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { fontSize: 13 }]}>KES {periodSummary.trialBalance.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Trial Balance</Text>
              </View>
            </View>

            <View style={styles.ledgerHeaderRow}>
              <Text style={[styles.ledgerHeaderCell, { flex: 2 }]}>Entry</Text>
              <Text style={[styles.ledgerHeaderCell, { textAlign: 'right' }]}>Dr</Text>
              <Text style={[styles.ledgerHeaderCell, { textAlign: 'right' }]}>Cr</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {periodSummary.filtered.map((tx, idx) => {
                const isDr = tx.type === 'expense' || tx.type === 'purchase' || tx.type === 'takeaway' || tx.type === 'consumed';
                const date = new Date(tx.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

                return (
                  <View key={idx} style={styles.ledgerItemRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.ledgerTxTitle}>{tx.title}</Text>
                      <Text style={styles.ledgerTxDesc}>{tx.description} · {date}</Text>
                    </View>
                    <Text style={[styles.ledgerTxAmt, { textAlign: 'right', color: '#f39c12' }]}>
                      {isDr ? `${tx.amount.toLocaleString()}` : '—'}
                    </Text>
                    <Text style={[styles.ledgerTxAmt, { textAlign: 'right', color: '#2ecc71' }]}>
                      {!isDr ? `${tx.amount.toLocaleString()}` : '—'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.pdfExportBtn} onPress={triggerPDFReport}>
              <Ionicons name="document-text-outline" size={18} color="#0d1a12" />
              <Text style={styles.pdfExportBtnText}>Generate Ledger PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OVERLAY: SETTINGS / BUSINESS NAME CONFIG */}
      <Modal visible={activeOverlay === 'settings'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Profile Settings</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>BUSINESS / HOTEL NAME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Change name..."
                placeholderTextColor="#4a5e4c"
                value={tempBusinessName}
                onChangeText={setTempBusinessName}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              if (tempBusinessName.trim()) {
                saveBusinessName(tempBusinessName);
                setActiveOverlay(null);
                Alert.alert('Settings Updated', 'Business context synced.');
              }
            }}>
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* OVERLAY: NOTIFICATIONS */}
      <Modal visible={activeOverlay === 'notifications'} animationType="slide" transparent>
        <View style={styles.overlayContainer}>
          <View style={styles.overlaySheet}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>System Notifications</Text>
              <TouchableOpacity onPress={() => setActiveOverlay(null)}>
                <Ionicons name="close" size={24} color="#f0f4f0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>All systems operational. No unread warnings.</Text>
                </View>
              ) : (
                notifications.map((n, i) => (
                  <View key={i} style={styles.notifRow}>
                    <View style={[styles.notifDot, n.read === 0 && { backgroundColor: '#e74c3c' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifMsg}>{n.message}</Text>
                      <Text style={styles.notifTime}>{new Date(n.date).toLocaleDateString()} · {new Date(n.date).toLocaleTimeString()}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              clearAllNotifs();
              setActiveOverlay(null);
            }}>
              <Text style={styles.saveBtnText}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD MEAL INVENTORY */}
      <Modal visible={mealModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Menu Item</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MEAL NAME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Mandazi, Coffee..."
                placeholderTextColor="#4a5e4c"
                value={newMealName}
                onChangeText={setNewMealName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PRICE PER PIECE (KES)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="KES"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={newMealPrice}
                onChangeText={setNewMealPrice}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>OPENING STOCK</Text>
              <TextInput
                style={styles.formInput}
                placeholder="200"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={newMealStock}
                onChangeText={setNewMealStock}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>LOW LEVEL ALERT LIMIT</Text>
              <TextInput
                style={styles.formInput}
                placeholder="20"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={newMealAlert}
                onChangeText={setNewMealAlert}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CHOOSE REPRESENTATIVE ICON</Text>
              <View style={styles.tabSelector}>
                {['🫓', '☕', '🥘', '🌾', '🍳', '🍞'].map((emoji, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.emojiBtn, newMealEmoji === emoji && { borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.1)' }]}
                    onPress={() => setNewMealEmoji(emoji)}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#1c201b', borderWidth: 1, borderColor: '#4a5e4c' }]} onPress={() => setMealModalVisible(false)}>
                <Text style={[styles.saveBtnText, { color: '#f0f4f0' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleAddMealSave}>
                <Text style={styles.saveBtnText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL: RECORD DEBTOR PAYMENT */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Record Debtor Payment</Text>
            <Text style={styles.modalSub}>{selectedDebtorName}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AMOUNT REMITTED (KES)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="KES"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={debtorPayAmount}
                onChangeText={setDebtorPayAmount}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>COLLECTION CHANNEL</Text>
              <View style={styles.tabSelector}>
                {['cash', 'mpesa'].map((method, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.tabSelectButton, debtorPayMethod === method && styles.tabSelectButtonActive]}
                    onPress={() => setDebtorPayMethod(method as any)}
                  >
                    <Text style={[styles.tabSelectText, debtorPayMethod === method && styles.tabSelectTextActive]}>
                      {method === 'cash' ? 'Cash' : 'M-Pesa'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#1c201b' }]} onPress={() => setPaymentModalVisible(false)}>
                <Text style={[styles.saveBtnText, { color: '#f0f4f0' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleDebtorPaymentSave}>
                <Text style={styles.saveBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL: RECORD CREDITOR PAYMENT */}
      <Modal visible={creditorPayModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Remit Creditor Settlement</Text>
            <Text style={styles.modalSub}>{selectedCreditorName}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>REMITTANCE AMOUNT (KES)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="KES"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={creditorPayAmount}
                onChangeText={setCreditorPayAmount}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#1c201b' }]} onPress={() => setCreditorPayModalVisible(false)}>
                <Text style={[styles.saveBtnText, { color: '#f0f4f0' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleCreditorPaymentSave}>
                <Text style={styles.saveBtnText}>Remit Payment</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0f0e'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  greetingText: {
    fontSize: 12,
    color: '#8a9e8c',
    marginBottom: 2
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c201b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c'
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46,204,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(46,204,113,0.3)'
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  viewPortScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40
  },
  tabContent: {
    flex: 1
  },
  salesCard: {
    backgroundColor: 'rgba(46,204,113,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(46,204,113,0.18)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12
  },
  salesLabel: {
    fontSize: 11,
    color: '#8a9e8c',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  salesAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f0f4f0',
    marginVertical: 4
  },
  salesBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#8a9e8c',
    marginBottom: 2
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f0f4f0'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f4f0',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 10,
    color: '#8a9e8c'
  },
  card: {
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8a9e8c',
    letterSpacing: 0.8
  },
  pillBadge: {
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(46,204,113,0.12)',
    color: '#2ecc71',
    fontWeight: 'bold'
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 70,
    marginVertical: 4
  },
  chartCol: {
    alignItems: 'center',
    width: 24
  },
  barTrack: {
    height: 60,
    width: 6,
    backgroundColor: '#1c201b',
    borderRadius: 3,
    justifyContent: 'flex-end'
  },
  barFill: {
    width: '100%',
    borderRadius: 3
  },
  barLabel: {
    fontSize: 8,
    color: '#4a5e4c',
    marginTop: 6
  },
  chartLegends: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    justifyContent: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendColor: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    fontSize: 9,
    color: '#8a9e8c'
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8a9e8c',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d1a12'
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6
  },
  actionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityInfo: {
    flex: 1
  },
  activityName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f0f4f0'
  },
  activityDetails: {
    fontSize: 10,
    color: '#8a9e8c',
    marginTop: 1
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    color: '#f0f4f0',
    fontSize: 13,
    padding: 0,
    marginLeft: 8
  },
  pillsContainer: {
    flexDirection: 'row',
    marginBottom: 12
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 6
  },
  pillActive: {
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderColor: 'rgba(46,204,113,0.3)'
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8a9e8c'
  },
  pillTextActive: {
    color: '#2ecc71'
  },
  txDateBadge: {
    fontSize: 8,
    color: '#4a5e4c',
    backgroundColor: '#1c201b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d1a12'
  },
  mealStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12
  },
  mealIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1c201b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  mealIconText: {
    fontSize: 20
  },
  mealStockInfo: {
    flex: 1
  },
  mealStockNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  mealStockName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  mealStockQty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  mealStockPrice: {
    fontSize: 10,
    color: '#8a9e8c',
    marginVertical: 2
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#1c201b',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 4
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5
  },
  debtorCreditorTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14
  },
  dcTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8
  },
  dcTabActive: {
    backgroundColor: '#1c201b'
  },
  dcTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8a9e8c'
  },
  dcTabTextActive: {
    color: '#f0f4f0',
    fontWeight: 'bold'
  },
  debtorCard: {
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  debtorInfoCol: {
    flex: 1
  },
  debtorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  debtorLastActivity: {
    fontSize: 9,
    color: '#8a9e8c',
    marginTop: 2
  },
  debtorOwedAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  debtorOwedLabel: {
    fontSize: 8,
    color: '#4a5e4c'
  },
  debtorStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8
  },
  debtorStatsText: {
    fontSize: 10,
    color: '#8a9e8c'
  },
  debtorActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  debtorActionPayBtn: {
    flex: 1,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8
  },
  debtorActionPayText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d1a12'
  },
  debtorActionClearBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(231,76,60,0.3)',
    backgroundColor: 'rgba(231,76,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingTabBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#141714',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabItemText: {
    fontSize: 9,
    color: '#4a5e4c',
    marginTop: 2
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  overlaySheet: {
    backgroundColor: '#141714',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 16,
    paddingBottom: 32
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 12,
    marginBottom: 12
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8a9e8c',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6
  },
  saleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  saleItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  saleItemPrice: {
    fontSize: 10,
    color: '#2ecc71',
    marginTop: 1
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    overflow: 'hidden'
  },
  qtyBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#1c201b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  qtyVal: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f0f4f0',
    backgroundColor: '#141714'
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#1c201b',
    borderRadius: 10,
    padding: 3,
    gap: 4
  },
  tabSelectButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabSelectButtonActive: {
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  tabSelectText: {
    fontSize: 11,
    color: '#8a9e8c',
    fontWeight: '500'
  },
  tabSelectTextActive: {
    color: '#2ecc71',
    fontWeight: 'bold'
  },
  fieldGroup: {
    marginVertical: 8
  },
  formInput: {
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#f0f4f0',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  summaryBreakdownCard: {
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    marginVertical: 12
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#8a9e8c'
  },
  summaryItemVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  saveBtn: {
    backgroundColor: '#2ecc71',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0d1a12'
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1c201b',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  periodPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8
  },
  periodPillActive: {
    backgroundColor: '#141714'
  },
  periodPillText: {
    fontSize: 9,
    color: '#8a9e8c',
    fontWeight: 'bold'
  },
  periodPillTextActive: {
    color: '#2ecc71'
  },
  summaryLedgerBoxes: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1c201b',
    paddingHorizontal: 8,
    borderRadius: 6
  },
  ledgerHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8a9e8c',
    flex: 1
  },
  ledgerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8
  },
  ledgerTxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  ledgerTxDesc: {
    fontSize: 8,
    color: '#8a9e8c',
    marginTop: 2
  },
  ledgerTxAmt: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1
  },
  pdfExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 12
  },
  pdfExportBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d1a12'
  },
  notifRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
    alignItems: 'flex-start'
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f0f4f0'
  },
  notifMsg: {
    fontSize: 10,
    color: '#8a9e8c',
    marginVertical: 2
  },
  notifTime: {
    fontSize: 8,
    color: '#4a5e4c'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 11,
    color: '#4a5e4c',
    textAlign: 'center'
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  modalSheet: {
    backgroundColor: '#141714',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f0f4f0',
    marginBottom: 2
  },
  modalSub: {
    fontSize: 11,
    color: '#8a9e8c',
    marginBottom: 12
  },
  emojiBtn: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c201b'
  },
  aiChatArea: {
    flex: 1,
    minHeight: 250,
    paddingBottom: 10
  },
  aiMessageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '85%'
  },
  aiBotBubble: {
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start'
  },
  aiUserBubble: {
    backgroundColor: '#2ecc71',
    alignSelf: 'flex-end'
  },
  aiMessageText: {
    fontSize: 12,
    lineHeight: 16
  },
  aiInputRow: {
    flexDirection: 'row',
    backgroundColor: '#1c201b',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 4,
    gap: 6
  },
  aiTextInput: {
    flex: 1,
    color: '#f0f4f0',
    fontSize: 13,
    paddingHorizontal: 8
  },
  aiSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
