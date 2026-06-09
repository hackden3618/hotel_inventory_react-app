import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoAlertProps {
  message: React.ReactNode;
}

export default function InfoAlert({ message }: InfoAlertProps) {
  return (
    <View className="flex-row items-start bg-primary/10 border-[0.5px] border-primary/20 p-4 rounded-[12px] mb-6">
      <Ionicons name="information-circle" size={20} color="#2ecc71" style={{ marginTop: 2 }} />
      <View className="flex-1 ml-3">
        <Text className="text-[13px] text-muted-foreground leading-5">
          {message}
        </Text>
      </View>
    </View>
  );
}
