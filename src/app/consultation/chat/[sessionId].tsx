import React, { useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ChevronLeft, Send } from 'lucide-react-native';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams();
  const { 
    sessions, 
    setSelectedSession, 
    messages, 
    messageDraft, 
    setMessageDraft, 
    handleSendMessage, 
    actionLoading 
  } = useConsultationsLogic();

  useEffect(() => {
    // Find the session and set it as selected
    if (sessionId && sessions.length > 0) {
      const session = sessions.find((s) => String(s.id) === String(sessionId));
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [sessionId, sessions, setSelectedSession]);

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderRole === 'MEMBER';
    
    return (
      <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        <View className={`max-w-[75%] p-3 rounded-2xl ${isMine ? 'bg-primary rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
          {!isMine && <Text className="text-xs font-semibold text-foreground mb-1">{item.senderName}</Text>}
          <Text className={isMine ? 'text-primary-foreground' : 'text-foreground'}>
            {item.content}
          </Text>
          <Text className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center p-4 border-b border-border mt-10">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} className="text-foreground" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground ml-2">Phiên tư vấn #{sessionId}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        inverted // Messages are fetched newest first or we need to reverse them
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-10">
            <Text className="text-muted-foreground">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</Text>
          </View>
        }
      />

      <View className="flex-row items-center p-3 border-t border-border bg-background">
        <TextInput
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-foreground mr-2 max-h-32"
          placeholder="Nhập tin nhắn..."
          value={messageDraft}
          onChangeText={setMessageDraft}
          multiline
        />
        <Pressable 
          onPress={handleSendMessage}
          disabled={!messageDraft.trim() || actionLoading}
          className={`p-3 rounded-full ${!messageDraft.trim() || actionLoading ? 'bg-muted' : 'bg-primary'}`}
        >
          {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Send size={20} className="text-white" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
