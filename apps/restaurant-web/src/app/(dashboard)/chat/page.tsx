'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/../../lib/supabase/client'

// --- Types ---
interface ConversationItem {
  id: string
  user_id: string
  last_message_at: string
  profiles: { full_name: string | null } | null
  messages: {
    content: string
    created_at: string
    is_read: boolean
    sender_role: string
  }[]
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: string
  content: string
  is_read: boolean
  created_at: string
}

type FilterTab = 'all' | 'unanswered'

// --- Helpers ---
function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// --- Page ---
export default function ChatPage() {
  const supabase = createClient()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get restaurant_id for the current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.restaurant_id) return

    const { data, error } = await supabase
      .from('conversations')
      .select(
        '*, profiles!conversations_user_id_fkey(full_name), messages(content, created_at, is_read, sender_role)'
      )
      .eq('restaurant_id', profile.restaurant_id)
      .order('last_message_at', { ascending: false })

    if (!error && data) {
      setConversations(data as ConversationItem[])
    }
  }, [supabase])

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false))
  }, [fetchConversations])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setLoadingMessages(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data as Message[])
      }
      setLoadingMessages(false)
    },
    [supabase]
  )

  // When active conversation changes, load messages
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId, fetchMessages])

  // Realtime subscription — listen for new messages
  useEffect(() => {
    if (!activeConversationId) return

    const channel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates from optimistic updates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Refresh conversation list to update last message preview
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversationId, fetchConversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !activeConversationId || sending) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSending(true)
    const content = inputText.trim()
    setInputText('')

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId,
      sender_id: user.id,
      sender_role: 'restaurant_admin',
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        sender_id: user.id,
        sender_role: 'restaurant_admin',
        content,
      })
      .select()
      .single()

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setInputText(content)
    } else if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m))
      )
    }

    setSending(false)
    // Refresh conversation list to update last message preview
    fetchConversations()
  }, [inputText, activeConversationId, sending, supabase, fetchConversations])

  // Handle Enter to send (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Filter conversations
  const getLastMessage = (conv: ConversationItem) => {
    if (!conv.messages || conv.messages.length === 0) return null
    const sorted = [...conv.messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return sorted[0]
  }

  const filteredConversations = conversations.filter((conv) => {
    if (filterTab === 'all') return true
    const lastMsg = getLastMessage(conv)
    if (!lastMsg) return true
    // "unanswered" = last message is from user (needs restaurant response)
    return lastMsg.sender_role === 'user'
  })

  const getUnreadCount = (conv: ConversationItem): number => {
    return conv.messages.filter((m) => !m.is_read && m.sender_role === 'user').length
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Left panel — Conversation list */}
      <aside className="w-80 border-r border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900 mb-3">Chat</h1>
          {/* Filter tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterTab('unanswered')}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                filterTab === 'unanswered'
                  ? 'bg-orange-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Nao respondidas
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-neutral-500 text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const clientName = conv.profiles?.full_name || 'Cliente'
              const lastMsg = getLastMessage(conv)
              const unread = getUnreadCount(conv)
              const isActive = conv.id === activeConversationId

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                    isActive ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {clientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-neutral-900 text-sm truncate">
                            {clientName}
                          </p>
                          {lastMsg && (
                            <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                              {timeAgo(lastMsg.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-neutral-500 truncate">
                            {lastMsg ? truncate(lastMsg.content, 40) : 'Sem mensagens'}
                          </p>
                          {unread > 0 && (
                            <span className="bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Right panel — Active conversation */}
      <main className="flex-1 flex flex-col">
        {!activeConversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-neutral-400 text-lg">Selecione uma conversa</p>
              <p className="text-neutral-300 text-sm mt-1">
                Escolha uma conversa na lista ao lado
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  {(activeConversation?.profiles?.full_name || 'C').charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-neutral-900">
                  {activeConversation?.profiles?.full_name || 'Cliente'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400 text-sm">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_role === 'restaurant_admin'
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 ${
                          isOwn
                            ? 'bg-orange-500 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white text-neutral-900 rounded-2xl rounded-bl-sm border border-neutral-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-1 px-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-neutral-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
