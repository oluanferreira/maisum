import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

// --- Types ---
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: string
  content: string
  is_read: boolean
  created_at: string
}

interface ConversationInfo {
  id: string
  restaurant_id: string
  restaurants: { name: string } | null
}

// --- Helpers ---
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// --- Component ---
export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const [messages, setMessages] = useState<Message[]>([])
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo | null>(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const flatListRef = useRef<FlatList>(null)
  const sendCooldownRef = useRef(false)

  // Load conversation info
  useEffect(() => {
    if (!id) return
    const loadInfo = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, restaurant_id, restaurants(name)')
        .eq('id', id)
        .single()

      if (data) {
        setConversationInfo(data as ConversationInfo)
      }
    }
    loadInfo()
  }, [id])

  // Load messages
  const fetchMessages = useCallback(async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data as Message[])
    }
  }, [id])

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false))
  }, [fetchMessages])

  // Mark received messages as read
  useEffect(() => {
    if (!id || !userId || messages.length === 0) return

    const unreadIds = messages
      .filter((m) => !m.is_read && m.sender_id !== userId)
      .map((m) => m.id)

    if (unreadIds.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds)
        .then(() => {
          // Update local state
          setMessages((prev) =>
            prev.map((m) =>
              unreadIds.includes(m.id) ? { ...m, is_read: true } : m
            )
          )
        })
    }
  }, [id, userId, messages.length])

  // Realtime subscription — listen for new messages
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates from optimistic updates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // Send message
  const handleSend = useCallback(async () => {
    if (sendCooldownRef.current) return
    if (!inputText.trim() || !id || !userId || sending) return
    sendCooldownRef.current = true
    setTimeout(() => { sendCooldownRef.current = false }, 500)

    setSending(true)
    const content = inputText.trim()
    setInputText('')

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: id,
      sender_id: userId,
      sender_role: 'user',
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: userId,
        sender_role: 'user',
        content,
      })
      .select()
      .single()

    if (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setInputText(content) // Restore input
    } else if (data) {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m))
      )
    }

    setSending(false)
  }, [inputText, id, userId, sending])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  // --- Render ---
  const restaurantName = conversationInfo?.restaurants?.name || 'Restaurante'

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_role === 'user'
    return (
      <View
        style={[styles.bubbleContainer, isOwn ? styles.bubbleRight : styles.bubbleLeft]}
      >
        <View
          style={[styles.bubble, isOwn ? styles.bubbleSent : styles.bubbleReceived]}
        >
          <Text style={[styles.bubbleText, isOwn ? styles.textSent : styles.textReceived]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isOwn ? styles.timestampRight : styles.timestampLeft]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurantName}
        </Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#FF6B35',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSent: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textSent: {
    color: '#FFFFFF',
  },
  textReceived: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timestampRight: {
    marginRight: 4,
  },
  timestampLeft: {
    marginLeft: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
})
