import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  initDatabase,
  getMeals,
  getTransactions,
  getDebtors,
  getCreditors,
  getNotifications,
  getUnreadNotificationsCount,
  getSetting,
  updateSetting,
  addTransaction,
  updateMealStock,
  updateDebtor,
  updateCreditor,
  clearDebtor as dbClearDebtor,
  addNotification,
  markNotificationsAsRead,
  addMeal,
  Meal,
  Transaction,
  Debtor,
  Creditor,
  Notification
} from './db';


interface AppContextType {
  businessName: string;
  meals: Meal[];
  transactions: Transaction[];
  debtors: Debtor[];
  creditors: Creditor[];
  notifications: Notification[];
  unreadNotifsCount: number;
  reportPeriod: 'today' | 'week' | 'month' | 'year' | 'all';
  setReportPeriod: (period: 'today' | 'week' | 'month' | 'year' | 'all') => void;
  refreshAll: () => void;
  saveBusinessName: (name: string) => void;
  recordSale: (
    items: { mealId: number; name: string; qty: number; price: number }[],
    saleType: 'dinein' | 'takeaway' | 'credit' | 'consumed',
    paymentMethod: 'cash' | 'mpesa' | 'credit' | 'none',
    referenceName?: string
  ) => void;
  recordExpense: (title: string, amount: number, paymentMethod: 'cash' | 'mpesa') => void;
  recordPurchase: (
    title: string,
    amount: number,
    isCredited: boolean,
    supplierName: string
  ) => void;
  recordDebtorPayment: (debtorName: string, amount: number, paymentMethod: 'cash' | 'mpesa') => void;
  recordCreditorPayment: (creditorName: string, amount: number) => void;
  clearDebtorAccount: (debtorId: number) => void;
  addNewMeal: (name: string, price: number, stock: number, lowAlert: number, image: string) => void;
  clearAllNotifs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [businessName, setBusinessName] = useState<string>("Wambu's corner hotel");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Initialize DB and load initial states
  useEffect(() => {
    try {
      initDatabase();
      refreshAll();
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }, []);

  const refreshAll = () => {
    setMeals(getMeals());
    setTransactions(getTransactions());
    setDebtors(getDebtors());
    setCreditors(getCreditors());
    setNotifications(getNotifications());
    setUnreadNotifsCount(getUnreadNotificationsCount());
    
    const savedName = getSetting('business_name');
    if (savedName) {
      setBusinessName(savedName);
    }
  };

  const saveBusinessName = (name: string) => {
    updateSetting('business_name', name);
    setBusinessName(name);
  };

  // Record a Sale
  const recordSale = (
    items: { mealId: number; name: string; qty: number; price: number }[],
    saleType: 'dinein' | 'takeaway' | 'credit' | 'consumed',
    paymentMethod: 'cash' | 'mpesa' | 'credit' | 'none',
    referenceName?: string
  ) => {
    let totalAmt = 0;
    const itemSummaries: string[] = [];

    // Deduct stock and calculate total
    items.forEach(item => {
      totalAmt += item.qty * item.price;
      itemSummaries.push(`${item.qty} ${item.name}`);
      
      const currentMeal = meals.find(m => m.id === item.mealId);
      if (currentMeal) {
        const remainingStock = Math.max(0, currentMeal.stock - item.qty);
        updateMealStock(item.mealId, remainingStock);
      }
    });

    const itemsText = itemSummaries.join(' · ');
    const displayType = saleType === 'takeaway' ? 'TakeAway' : saleType === 'credit' ? 'Credit' : saleType === 'consumed' ? 'Consumed' : 'Dine-In';

    // 1. Add general transaction record
    if (saleType === 'consumed') {
      addTransaction(
        'consumed',
        'Meals Consumed (Internal)',
        itemsText,
        totalAmt,
        'none',
        referenceName
      );
      addNotification(
        'Internal Consumption',
        `${itemsText} consumed locally (non-sold)`,
        'flow'
      );
    } else if (saleType === 'takeaway') {
      addTransaction(
        'takeaway',
        'Meal Taken Out',
        itemsText,
        totalAmt,
        'none',
        referenceName
      );
      addNotification(
        'Meal Taken Away',
        `${itemsText} taken out by ${referenceName || 'customer'}`,
        'flow'
      );
    } else if (saleType === 'credit') {
      const debtorName = referenceName || 'Walk-in Debtor';
      addTransaction(
        'sale',
        `Credit Sale — ${debtorName}`,
        itemsText,
        totalAmt,
        'credit',
        debtorName
      );
      // Accumulate debtor owed amount
      updateDebtor(debtorName, totalAmt, 0);
      addNotification(
        'Credit Sale Recorded',
        `Owed KES ${totalAmt.toLocaleString()} by ${debtorName}`,
        'payment'
      );
    } else {
      // Dine-in sale
      addTransaction(
        'sale',
        `Sale — ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}`,
        itemsText,
        totalAmt,
        paymentMethod
      );
      addNotification(
        'Sale Saved',
        `Collected KES ${totalAmt.toLocaleString()} via ${paymentMethod.toUpperCase()}`,
        'flow'
      );
    }

    refreshAll();
  };

  // Record an Expense
  const recordExpense = (title: string, amount: number, paymentMethod: 'cash' | 'mpesa') => {
    addTransaction('expense', `Expense — ${title}`, 'Non-stock business expense', amount, paymentMethod);
    addNotification('Expense Logged', `Spent KES ${amount.toLocaleString()} on ${title}`, 'flow');
    refreshAll();
  };

  // Record a Purchase (Restocking)
  const recordPurchase = (
    title: string,
    amount: number,
    isCredited: boolean,
    supplierName: string
  ) => {
    const method = isCredited ? 'credit' : 'cash';
    addTransaction(
      'purchase',
      `${isCredited ? 'Credited' : 'Paid'} Purchase`,
      title,
      amount,
      method,
      supplierName
    );

    if (isCredited) {
      // Accumulate total owed to creditor
      updateCreditor(supplierName, amount, 0);
      addNotification(
        'Credited Purchase Logged',
        `We owe KES ${amount.toLocaleString()} to ${supplierName}`,
        'payment'
      );
    } else {
      addNotification(
        'Purchase Recorded',
        `Paid KES ${amount.toLocaleString()} to ${supplierName}`,
        'flow'
      );
    }
    refreshAll();
  };

  // Record Debtor Payment
  const recordDebtorPayment = (debtorName: string, amount: number, paymentMethod: 'cash' | 'mpesa') => {
    addTransaction(
      'debtor_payment',
      `Debtor Payment — ${debtorName}`,
      `Owed balance clearance via ${paymentMethod.toUpperCase()}`,
      amount,
      paymentMethod,
      debtorName
    );
    
    // Accumulate payment to debtor (reduces outstanding owed balance)
    updateDebtor(debtorName, 0, amount);
    addNotification(
      'Debtor Paid',
      `${debtorName} paid KES ${amount.toLocaleString()}`,
      'payment'
    );
    refreshAll();
  };

  // Record Creditor Payment
  const recordCreditorPayment = (creditorName: string, amount: number) => {
    addTransaction(
      'creditor_payment',
      `Paid Creditor — ${creditorName}`,
      'Creditor account paid',
      amount,
      'cash',
      creditorName
    );

    // Reduce creditor amount owed
    updateCreditor(creditorName, -amount, 0);
    addNotification(
      'Creditor Paid',
      `Paid KES ${amount.toLocaleString()} to ${creditorName}`,
      'payment'
    );
    refreshAll();
  };

  // Clear Debtor
  const clearDebtorAccount = (debtorId: number) => {
    dbClearDebtor(debtorId);
    refreshAll();
  };

  // Add new Meal
  const addNewMeal = (name: string, price: number, stock: number, lowAlert: number, image: string) => {
    addMeal(name, price, stock, lowAlert, image);
    addNotification('New Meal Registered', `Added ${name} to menu at KES ${price}`, 'general');
    refreshAll();
  };

  // Clear All Notifications
  const clearAllNotifs = () => {
    markNotificationsAsRead();
    refreshAll();
  };

  return (
    <AppContext.Provider
      value={{
        businessName,
        meals,
        transactions,
        debtors,
        creditors,
        notifications,
        unreadNotifsCount,
        reportPeriod,
        setReportPeriod,
        refreshAll,
        saveBusinessName,
        recordSale,
        recordExpense,
        recordPurchase,
        recordDebtorPayment,
        recordCreditorPayment,
        clearDebtorAccount,
        addNewMeal,
        clearAllNotifs
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
