import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/database/AppContext';
import { Meal, InventoryItem } from '@/database/db';

interface InventoryScreenProps {
  setMealModalVisible: (visible: boolean) => void;
  setInventoryModalVisible: (visible: boolean) => void;
  setEditingMeal: (meal: Meal | undefined) => void;
  setEditingInventoryItem: (item: InventoryItem | undefined) => void;
}

type Tab = 'meals' | 'ingredients';

export default function InventoryScreen({
  setMealModalVisible,
  setInventoryModalVisible,
  setEditingMeal,
  setEditingInventoryItem
}: InventoryScreenProps) {
  const { meals, inventoryItems, toggleMealAvailability } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('meals');
  const [search, setSearch] = useState('');

  const filteredMeals = meals.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1">
      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <View className="flex-row bg-[#1c201b] rounded-[12px] p-[3px] mb-4">
        {([
          { id: 'meals', label: 'Prepared Meals' },
          { id: 'ingredients', label: 'Raw Ingredients' },
        ] as { id: Tab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-2 items-center rounded-[10px] ${
              activeTab === tab.id ? 'bg-[#141714] border-[0.5px] border-white/5' : ''
            }`}
            onPress={() => {
              setActiveTab(tab.id);
              setSearch('');
            }}
          >
            <Text
              className={`text-[12px] font-bold ${
                activeTab === tab.id ? 'text-[#2ecc71]' : 'text-[#8a9e8c]'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Prepared Meals Tab ───────────────────────────────────────────── */}
      {activeTab === 'meals' && (
        <View className="flex-1">
          {/* Search */}
          <View className="flex-row items-center bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] px-3 py-2 mb-3">
            <Ionicons name="search" size={16} color="#8a9e8c" />
            <TextInput
              className="flex-1 text-[#f0f4f0] text-[13px] p-0 ml-2"
              placeholder="Search meals..."
              placeholderTextColor="#4a5e4c"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#4a5e4c" />
              </TouchableOpacity>
            )}
          </View>

          {/* Header row */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] uppercase">
              Menu Stock Levels
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-[#2ecc71] py-1.5 px-3 rounded-lg gap-1"
              onPress={() => setMealModalVisible(true)}
            >
              <Ionicons name="add" size={15} color="#0d1a12" />
              <Text className="text-[11px] font-bold text-[#0d1a12]">Add Meal</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredMeals}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 14 }}
            className="mt-2"
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-[13px] text-[#4a5e4c]">No meals found.</Text>
              </View>
            }
            renderItem={({ item: meal }) => {
              const isAvailable = meal.isAvailable === 1;
              const stockPct = Math.min(100, (meal.stock / 210) * 100);
              const isLow = meal.stock <= meal.lowAlert;

              return (
                <View className={`flex-1 m-1 p-3 bg-[#1c201b] rounded-xl border-[0.5px] border-white/5 ${!isAvailable ? 'opacity-50' : ''}`}>
                  {/* Prominent Image/Emoji */}
                  <View className="w-full aspect-square rounded-lg bg-[#141714] items-center justify-center border-[0.5px] border-white/5 mb-3">
                    {meal.image && (meal.image.startsWith('file://') || meal.image.startsWith('content://')) ? (
                      <Image source={{ uri: meal.image }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                    ) : (
                      <Text className="text-[40px]">{meal.image || '🫓'}</Text>
                    )}
                  </View>

                  {/* Info */}
                  <Text className={`text-[14px] font-bold mb-1 ${isAvailable ? 'text-[#f0f4f0]' : 'text-[#4a5e4c] line-through'}`} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <Text className="text-[12px] text-[#8a9e8c] mb-2">KES {meal.price}</Text>

                  {/* Stock */}
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`text-[10px] font-bold ${isLow ? 'text-[#e74c3c]' : 'text-[#2ecc71]'}`}>
                      {meal.stock} in stock
                    </Text>
                  </View>
                  <View className="h-[3px] bg-[#141714] rounded-full overflow-hidden mb-3">
                    <View
                      className={`h-full rounded-full ${isLow ? 'bg-[#e74c3c]' : 'bg-[#2ecc71]'}`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </View>

                  {/* Action Row */}
                  <View className="flex-row items-center justify-between mt-auto pt-2 border-t-[0.5px] border-white/5">
                    <View className="items-center flex-row gap-1">
                      <Switch
                        value={isAvailable}
                        onValueChange={val => toggleMealAvailability(meal.id, val)}
                        trackColor={{ false: '#141714', true: '#1a6e3f' }}
                        thumbColor={isAvailable ? '#2ecc71' : '#4a5e4c'}
                        ios_backgroundColor="#141714"
                        style={{ transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }] }}
                      />
                      <Text className="text-[9px] text-[#4a5e4c]">{isAvailable ? 'On' : 'Off'}</Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-[#2ecc71]/20 p-1.5 rounded-full"
                      onPress={() => {
                        setEditingMeal(meal);
                        setMealModalVisible(true);
                      }}
                    >
                      <Ionicons name="pencil" size={14} color="#2ecc71" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ── Raw Ingredients Tab ──────────────────────────────────────────── */}
      {activeTab === 'ingredients' && (
        <View className="flex-1">
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] uppercase">
              Raw Stock
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-[#2ecc71] py-1.5 px-3 rounded-lg gap-1"
              onPress={() => setInventoryModalVisible(true)}
            >
              <Ionicons name="add" size={15} color="#0d1a12" />
              <Text className="text-[11px] font-bold text-[#0d1a12]">Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={inventoryItems}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 14 }}
            className="mt-2"
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-[13px] text-[#4a5e4c]">No raw ingredients yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="flex-1 m-1 p-3 bg-[#1c201b] rounded-xl border-[0.5px] border-white/5">
                {/* Prominent Image/Icon */}
                <View className="w-full aspect-square rounded-lg bg-[#141714] items-center justify-center border-[0.5px] border-white/5 overflow-hidden mb-3">
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name="leaf-outline" size={32} color="#2ecc71" />
                  )}
                </View>

                {/* Info */}
                <Text className="text-[14px] font-bold text-[#f0f4f0] mb-1" numberOfLines={1}>
                  {item.name}
                </Text>
                
                <View className="flex-row items-end mb-2">
                  <Text className="text-[12px] font-bold text-[#2ecc71]">KES {item.price}</Text>
                  <Text className="text-[9px] text-[#4a5e4c] ml-1">/ {item.unit}</Text>
                </View>

                {/* Stock */}
                <Text className="text-[11px] text-[#8a9e8c] mb-3">
                  {item.stockLevel} {item.unit} in stock
                </Text>

                {/* Action Row */}
                <View className="flex-row items-center justify-end mt-auto pt-2 border-t-[0.5px] border-white/5">
                  <TouchableOpacity 
                    className="bg-[#2ecc71]/20 p-1.5 rounded-full"
                    onPress={() => {
                      setEditingInventoryItem(item);
                      setInventoryModalVisible(true);
                    }}
                  >
                    <Ionicons name="pencil" size={14} color="#2ecc71" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
