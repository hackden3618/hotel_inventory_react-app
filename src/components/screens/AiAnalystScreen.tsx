import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AiAnalystScreen() {
  const [aiChat, setAiChat] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Hello! I am your AI Analyst. How can I help you today?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const handleAISubmit = () => {
    if (!aiInput.trim()) return;
    setAiChat(prev => [...prev, { sender: 'user', text: aiInput }]);
    setAiInput('');
    setAiLoading(true);
    setTimeout(() => {
      setAiChat(prev => [...prev, { sender: 'bot', text: 'Sorry, AI analysis is not fully implemented offline yet.' }]);
      setAiLoading(false);
    }, 1000);
  };
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <View className="flex-1 min-h-[250px] pb-2.5">
        {aiChat.map((msg, i) => (
          <View
            key={i}
            className={`p-2.5 rounded-xl my-1 max-w-[85%] ${
              msg.sender === 'user'
                ? 'bg-[#2ecc71] self-end'
                : 'bg-[#1c201b] border-[0.5px] border-white/5 self-start'
            }`}
          >
            <Text
              className={`text-[12px] leading-4 ${
                msg.sender === 'user' ? 'text-[#0d1a12]' : 'text-[#f0f4f0]'
              }`}
            >
              {msg.text}
            </Text>
          </View>
        ))}
        {aiLoading && (
          <ActivityIndicator
            size="small"
            color="#2ecc71"
            className="my-2 self-start"
          />
        )}
      </View>

      <View className="flex-row bg-[#1c201b] border-[0.5px] border-white/10 rounded-[10px] p-1 gap-1.5">
        <TextInput
          className="flex-1 text-[#f0f4f0] text-[13px] px-2"
          placeholder="Ask about margin, debtors or inventory..."
          placeholderTextColor="#4a5e4c"
          value={aiInput}
          onChangeText={setAiInput}
        />
        <TouchableOpacity
          className="w-8 h-8 rounded-lg bg-[#2ecc71] items-center justify-center"
          onPress={handleAISubmit}
        >
          <Ionicons name="send" size={16} color="#0d1a12" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
