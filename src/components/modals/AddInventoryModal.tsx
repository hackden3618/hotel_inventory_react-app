import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/database/AppContext';
import { InventoryItem } from '@/database/db';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

interface AddInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  editingItem?: InventoryItem;
}

export default function AddInventoryModal({ visible, onClose, editingItem }: AddInventoryModalProps) {
  const { addRawInventoryItem, updateRawInventoryItem } = useApp();
  
  const [name, setName] = useState(editingItem?.name || '');
  const [stock, setStock] = useState(editingItem ? String(editingItem.stockLevel) : '');
  const [unit, setUnit] = useState(editingItem?.unit || '');
  const [price, setPrice] = useState(editingItem ? String(editingItem.price) : '');
  const [imageUri, setImageUri] = useState<string | null>(editingItem?.imageUri || null);

  React.useEffect(() => {
    if (visible) {
      setName(editingItem?.name || '');
      setStock(editingItem ? String(editingItem.stockLevel) : '');
      setUnit(editingItem?.unit || '');
      setPrice(editingItem ? String(editingItem.price) : '');
      setImageUri(editingItem?.imageUri || null);
    }
  }, [visible, editingItem]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name || !stock || !unit || !price) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    
    const parsedPrice = parseFloat(price);
    const parsedStock = parseFloat(stock);
    
    if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Validation Error', 'Prices and stocks must be positive numbers.');
      return;
    }

    if (editingItem) {
      updateRawInventoryItem(editingItem.id, name, parsedStock, unit, parsedPrice, imageUri || undefined);
    } else {
      addRawInventoryItem(name, parsedStock, unit, parsedPrice, imageUri || undefined);
    }

    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">{editingItem ? 'Edit Raw Ingredient' : 'Add Raw Ingredient'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <View className="my-2 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">INGREDIENT NAME</Text>
              <TextInput
                className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
                placeholder="e.g. Wheat Flour, Cooking Oil..."
                placeholderTextColor="#4a5e4c"
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <TouchableOpacity onPress={pickImage} className="w-16 h-16 rounded-[10px] bg-[#1c201b] border-[0.5px] border-white/10 items-center justify-center overflow-hidden mt-3">
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text className="text-[10px] text-[#8a9e8c] text-center">Add{'\n'}Photo</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">UNIT OF MEASURE</Text>
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
              placeholder="e.g. kg, litres, bags..."
              placeholderTextColor="#4a5e4c"
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          <View className="flex-row gap-3 my-2">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">OPENING STOCK</Text>
              <TextInput
                className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={stock}
                onChangeText={setStock}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">PRICE PER UNIT (KES)</Text>
              <TextInput
                className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#4a5e4c"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity className="flex-1 bg-[#1c201b] border border-[#4a5e4c] rounded-[10px] py-3 items-center justify-center" onPress={onClose}>
              <Text className="text-[13px] font-bold text-[#f0f4f0]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center" onPress={handleSave}>
              <Text className="text-[13px] font-bold text-[#0d1a12]">{editingItem ? 'Save Changes' : 'Add Ingredient'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
    </AppBottomSheet>
  );
}