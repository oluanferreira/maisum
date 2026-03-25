import { useEffect, useRef, Component, type ReactNode } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/auth'
import { Text, View, TouchableOpacity } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications } from '../services/notifications'

// --- Error Boundary ---
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F5', padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>
            Algo deu errado
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message ?? 'Erro inesperado'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

// --- Auth Listener (no redirect logic — index.tsx handles routing) ---
function AuthListener({ children }: { children: ReactNode }) {
  const { setSession, setLoading } = useAuthStore()
  const router = useRouter()
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null)
  const hasRegisteredPush = useRef(false)

  useEffect(() => {
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setLoading(false)

        // Register for push notifications when user is authenticated (once only)
        if (session && !hasRegisteredPush.current) {
          hasRegisteredPush.current = true
          registerForPushNotifications().catch((err) =>
            console.warn('[Push] Registration failed:', err)
          )
        }
      })

      // Listen for notification taps (deep linking)
      notificationResponseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data
          if (data?.url && typeof data.url === 'string' && data.url.startsWith('/')) {
            router.push(data.url as any)
          }
        })

      return () => {
        subscription.unsubscribe()
        if (notificationResponseListener.current) {
          Notifications.removeNotificationSubscription(notificationResponseListener.current)
        }
      }
    } catch (err) {
      console.warn('[AuthListener] Failed to initialize auth:', err)
      setLoading(false)
    }
  }, [])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthListener>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthListener>
      </SafeAreaProvider>
    </AppErrorBoundary>
  )
}
