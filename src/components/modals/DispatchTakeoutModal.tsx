import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

interface DispatchTakeoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DispatchTakeoutModal({ visible, onClose }: DispatchTakeoutModalProps) {
  const { meals, dispatchTakeout } = useApp();
  const [staffName, setStaffName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ mealId: number; name: string; qty: number; price: number }[]>([]);

  const handleIncrement = (mealId: number, name: string, price: number, stock: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.mealId === mealId);
      if (existing) {
        if (existing.qty >= stock) {
          Alert.alert('Stock Limit', 'Cannot dispatch more than available stock.');
          return prev;
        }
        return prev.map(item => item.mealId === mealId ? { ...item, qty: item.qty + 1 } : item);
      }
      if (stock > 0) {
        return [...prev, { mealId, name, qty: 1, price }];
      } else {
        Alert.alert('Out of Stock', 'This meal is currently out of stock.');
        return prev;
      }
    });
  };

  const handleDecrement = (mealId: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.mealId === mealId);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.mealId === mealId ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => item.mealId !== mealId);
    });
  };

  const handleSetQuantity = (mealId: number, name: string, price: number, stock: number, text: string) => {
    const qty = parseInt(text) || 0;
    setSelectedItems(prev => {
      if (qty <= 0) {
        return prev.filter(item => item.mealId !== mealId);
      }
      
      const cappedQty = Math.min(qty, stock);
      const existing = prev.find(item => item.mealId === mealId);
      if (existing) {
        return prev.map(item => item.mealId === mealId ? { ...item, qty: cappedQty } : item);
      }
      return [...prev, { mealId, name, qty: cappedQty, price }];
    });
  };

  const handleDispatch = () => {
    if (!staffName.trim()) {
      Alert.alert('Validation Error', 'Please provide the staff member name taking out the goods.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item.');
      return;
    }
    dispatchTakeout(staffName, selectedItems);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStaffName('');
    setSelectedItems([]);
  };

  const availableMeals = meals.filter(m => m.isAvailable === 1);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between p-5 border-b-[0.5px] border-white/5">
            <View>
              <Text className="text-[16px] font-bold text-[#f0f4f0]">Dispatch Takeout</Text>
              <Text className="text-[11px] text-[#8a9e8c] mt-0.5">Assign goods for outside catering</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center rounded-full bg-[#1c201b]">
              <Ionicons name="close" size={18} color="#8a9e8c" />
            </TouchableOpacity>
          </View>

          <View className="px-5 py-4 border-b-[0.5px] border-white/5">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mb-1.5 uppercase">
              Staff Member (Required)
            </Text>
            <View className="flex-row items-center bg-[#1c201b] border-[0.5px] border-white/5 rounded-[10px] px-3 h-11">
              <Ionicons name="person-outline" size={16} color="#8a9e8c" />
              <TextInput
                className="flex-1 text-[13px] text-[#f0f4f0] ml-2"
                placeholder="e.g. John Doe"
                placeholderTextColor="#4a5e4c"
                value={staffName}
                onChangeText={setStaffName}
              />
            </View>
          </View>

          <View className="px-5 py-4">
            {availableMeals.map((item) => {
              const selectedQty = selectedItems.find(i => i.mealId === item.id)?.qty || 0;
              return (
                <View key={item.id} className="flex-row items-center justify-between mb-4 bg-[#141714] p-3 rounded-[10px] border-[0.5px] border-white/5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-[10px] bg-[#1c201b] items-center justify-center mr-3">
                      <Text className="text-[18px]">{item.image}</Text>
                    </View>
                    <View>
                      <Text className="text-[13px] font-bold text-[#f0f4f0]">{item.name}</Text>
                      <Text className="text-[11px] text-[#8a9e8c] mt-0.5">Stock: {item.stock}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center bg-[#1c201b] rounded-lg">
                    <TouchableOpacity 
                      className="w-8 h-8 items-center justify-center"
                      onPress={() => handleDecrement(item.id)}
                    >
                      <Ionicons name="remove" size={16} color={selectedQty > 0 ? "#e74c3c" : "#4a5e4c"} />
                    </TouchableOpacity>
                    <TextInput
                      className="text-[13px] font-bold text-[#f0f4f0] w-10 text-center"
                      keyboardType="numeric"
                      value={selectedQty > 0 ? selectedQty.toString() : ''}
                      onChangeText={(text) => handleSetQuantity(item.id, item.name, item.price, item.stock, text)}
                      placeholder="0"
                      placeholderTextColor="#4a5e4c"
                    />
                    <TouchableOpacity 
                      className="w-8 h-8 items-center justify-center"
                      onPress={() => handleIncrement(item.id, item.name, item.price, item.stock)}
                    >
                      <Ionicons name="add" size={16} color="#2ecc71" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="flex-row gap-2 px-5 pb-5 pt-3 border-t-[0.5px] border-white/5 bg-[#0d1a12]">
            <View className="flex-1 bg-[#141714] rounded-[10px] justify-center px-4">
              <Text className="text-[10px] text-[#8a9e8c]">Total Items</Text>
              <Text className="text-[14px] font-bold text-[#2ecc71]">{totalItems}</Text>
            </View>
            <TouchableOpacity
              className="flex-[2] bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center"
              onPress={handleDispatch}
            >
              <Text className="text-[13px] font-bold text-[#0d1a12]">Dispatch Session</Text>
            </TouchableOpacity>
          </View>
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}