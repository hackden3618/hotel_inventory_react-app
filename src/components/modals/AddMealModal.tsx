import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { BottomSheetScrollView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/database/AppContext';
import { Meal } from '@/database/db';
import AppBottomSheet from '@/components/ui/AppBottomSheet';

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  editingMeal?: Meal;
}

export default function AddMealModal({ visible, onClose, editingMeal }: AddMealModalProps) {
  const { addNewMeal, updateMeal } = useApp();
  
  const [newMealName, setNewMealName] = useState(editingMeal?.name || '');
  const [newMealPrice, setNewMealPrice] = useState(editingMeal ? String(editingMeal.price) : '');
  const [newMealStock, setNewMealStock] = useState(editingMeal ? String(editingMeal.stock) : '');
  const [newMealAlert, setNewMealAlert] = useState(editingMeal ? String(editingMeal.lowAlert) : '');
  const [newMealEmoji, setNewMealEmoji] = useState(editingMeal?.image || '🫓');
  const [imageUri, setImageUri] = useState<string | null>(
    editingMeal?.image && (editingMeal.image.startsWith('file://') || editingMeal.image.startsWith('content://'))
      ? editingMeal.image
      : null
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewMealEmoji(''); // Clear emoji if an image is picked
    }
  };

  // Reset or initialize fields when modal opens
  React.useEffect(() => {
    if (visible) {
      setNewMealName(editingMeal?.name || '');
      setNewMealPrice(editingMeal ? String(editingMeal.price) : '');
      setNewMealStock(editingMeal ? String(editingMeal.stock) : '');
      setNewMealAlert(editingMeal ? String(editingMeal.lowAlert) : '');
      setNewMealEmoji(editingMeal?.image || '🫓');
      setImageUri(
        editingMeal?.image && (editingMeal.image.startsWith('file://') || editingMeal.image.startsWith('content://'))
          ? editingMeal.image
          : null
      );
    }
  }, [visible, editingMeal]);

  const handleAddMealSave = () => {
    if (!newMealName || !newMealPrice || !newMealStock) {
      Alert.alert('Validation Error', 'Please fill in meal name, price and opening stock.');
      return;
    }
    
    const price = parseFloat(newMealPrice);
    const stock = parseInt(newMealStock, 10);
    const alertLvl = parseInt(newMealAlert, 10) || 10;
    
    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || isNaN(alertLvl) || alertLvl < 0) {
      Alert.alert('Validation Error', 'Prices and stocks must be positive numbers.');
      return;
    }

    const finalImage = imageUri || newMealEmoji || '🫓';

    if (editingMeal) {
      updateMeal(editingMeal.id, newMealName, price, stock, alertLvl, finalImage);
    } else {
      addNewMeal(newMealName, price, stock, alertLvl, finalImage);
    }

    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[15px] font-bold text-[#f0f4f0]">{editingMeal ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#f0f4f0" />
            </TouchableOpacity>
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">MEAL NAME</Text>
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
              placeholder="e.g. Mandazi, Coffee..."
              placeholderTextColor="#4a5e4c"
              value={newMealName}
              onChangeText={setNewMealName}
            />
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">PRICE PER PIECE (KES)</Text>
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
              placeholder="KES"
              keyboardType="numeric"
              placeholderTextColor="#4a5e4c"
              value={newMealPrice}
              onChangeText={setNewMealPrice}
            />
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">OPENING STOCK</Text>
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
              placeholder="200"
              keyboardType="numeric"
              placeholderTextColor="#4a5e4c"
              value={newMealStock}
              onChangeText={setNewMealStock}
            />
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">LOW LEVEL ALERT LIMIT</Text>
            <TextInput
              className="bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] text-[#f0f4f0] text-[13px] px-3 py-2.5"
              placeholder="20"
              keyboardType="numeric"
              placeholderTextColor="#4a5e4c"
              value={newMealAlert}
              onChangeText={setNewMealAlert}
            />
          </View>

          <View className="my-2">
            <Text className="text-[10px] font-bold text-[#8a9e8c] tracking-[0.8px] mt-2.5 mb-1.5">CHOOSE ICON OR PHOTO</Text>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row bg-[#1c201b] rounded-[10px] p-[3px] gap-1">
                {['🫓', '☕', '🥘', '🌾', '🍳', '🍞'].map((emoji, i) => (
                  <TouchableOpacity
                    key={i}
                    className={`flex-1 aspect-square border ${(!imageUri && newMealEmoji === emoji) ? 'border-[#2ecc71] bg-[#2ecc71]/10' : 'border-transparent'} rounded-[8px] items-center justify-center`}
                    onPress={() => {
                      setNewMealEmoji(emoji);
                      setImageUri(null); // Clear image if emoji is picked
                    }}
                  >
                    <Text className="text-[20px]">{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={pickImage} className="w-12 h-12 rounded-[10px] bg-[#1c201b] border-[0.5px] border-white/10 items-center justify-center overflow-hidden">
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Ionicons name="camera-outline" size={20} color="#8a9e8c" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity className="flex-1 bg-[#1c201b] border border-[#4a5e4c] rounded-[10px] py-3 items-center justify-center" onPress={onClose}>
              <Text className="text-[13px] font-bold text-[#f0f4f0]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#2ecc71] rounded-[10px] py-3 items-center justify-center" onPress={handleAddMealSave}>
              <Text className="text-[13px] font-bold text-[#0d1a12]">{editingMeal ? 'Save Changes' : 'Add Meal'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
    </AppBottomSheet>
  );
}