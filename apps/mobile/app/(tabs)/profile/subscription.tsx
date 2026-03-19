import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

// --- Types ---
interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  paid_at: string | null
  created_at: string
}

interface Subscription {
  id: string
  user_id: string
  plan_type: 'monthly' | 'annual'
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  current_period_start: string
  current_period_end: string
  created_at: string
  payments: Payment[]
}

// --- Helpers ---
function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#22C55E'
    case 'cancelled': return '#F59E0B'
    case 'past_due': return '#EF4444'
    case 'expired': return '#9CA3AF'
    case 'paid': return '#22C55E'
    case 'failed': return '#EF4444'
    case 'pending': return '#F59E0B'
    default: return '#6B7280'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Ativa'
    case 'cancelled': return 'Cancelada'
    case 'past_due': return 'Pagamento pendente'
    case 'expired': return 'Expirada'
    case 'paid': return 'Pago'
    case 'failed': return 'Falhou'
    case 'pending': return 'Pendente'
    case 'refunded': return 'Reembolsado'
    default: return status
  }
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'pix': return 'PIX'
    case 'credit_card': return 'Cartao'
    case 'boleto': return 'Boleto'
    default: return method
  }
}

// --- Status Badge Component ---
function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
      <Text style={[styles.statusBadgeText, { color: getStatusColor(status) }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  )
}

// --- Payment Item Component ---
function PaymentItem({ payment }: { payment: Payment }) {
  return (
    <View style={styles.paymentItem}>
      <View style={styles.paymentLeft}>
        <Text style={styles.paymentDate}>
          {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
        </Text>
        <Text style={styles.paymentMethod}>{getPaymentMethodLabel(payment.payment_method)}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
        <StatusBadge status={payment.status} />
      </View>
    </View>
  )
}

// --- Main Screen ---
export default function SubscriptionScreen() {
  const router = useRouter()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [couponCount, setCouponCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)

      // Fetch active subscription with payments
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*, payments(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (subError && subError.code !== 'PGRST116') {
        // PGRST116 = no rows found (not a real error, just no subscription)
        throw subError
      }

      if (subData) {
        // Sort payments by created_at DESC and limit to last 5
        const sortedPayments = (subData.payments || [])
          .sort((a: Payment, b: Payment) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          .slice(0, 5)

        setSubscription({ ...subData, payments: sortedPayments })

        // Fetch available coupon count
        const { count, error: couponError } = await supabase
          .from('coupons')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'available')

        if (!couponError && count !== null) {
          setCouponCount(count)
        }
      } else {
        setSubscription(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar assinatura'
      setError(message)
      console.error('[SUBSCRIPTION]', message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchData()
  }, [fetchData])

  const handleCancel = () => {
    if (!subscription) return

    const endDate = formatDate(subscription.current_period_end)

    Alert.alert(
      'Cancelar Assinatura',
      `Ao cancelar, sua assinatura continua ativa ate ${endDate}. Seus cupons disponiveis permanecem validos ate o fim do periodo.\n\nDeseja confirmar o cancelamento?`,
      [
        { text: 'Manter Assinatura', style: 'cancel' },
        {
          text: 'Confirmar Cancelamento',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true)
            try {
              const { error: cancelError } = await supabase
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('id', subscription.id)

              if (cancelError) throw cancelError

              Alert.alert(
                'Assinatura Cancelada',
                `Seu acesso continua ativo ate ${endDate}.`,
              )
              fetchData()
            } catch {
              Alert.alert('Erro', 'Nao foi possivel cancelar. Tente novamente.')
            } finally {
              setIsCancelling(false)
            }
          },
        },
      ],
    )
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando assinatura...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // --- Error State ---
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- No Subscription State ---
  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Voce nao tem uma assinatura ativa</Text>
          <Text style={styles.emptySubtitle}>
            Assine um plano para comecar a receber seus cupons.
          </Text>
          <TouchableOpacity
            style={styles.plansButton}
            onPress={() => router.push('/plans')}
          >
            <Text style={styles.plansButtonText}>Ver Planos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- Active Subscription ---
  const planLabel = subscription.plan_type === 'annual' ? 'Plano Anual' : 'Plano Mensal'

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />
        }
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Gerenciar Assinatura</Text>

        {/* Plan Badge */}
        <View style={styles.planBadgeContainer}>
          <View style={[
            styles.planBadge,
            { backgroundColor: subscription.plan_type === 'annual' ? '#FF6B35' : '#6B7280' },
          ]}>
            <Text style={styles.planBadgeText}>{planLabel}</Text>
          </View>
          <StatusBadge status={subscription.status} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Renovacao em</Text>
            <Text style={styles.infoValue}>{formatDate(subscription.current_period_end)}</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cupons disponiveis</Text>
            <Text style={[styles.infoValue, styles.couponCount]}>{couponCount}</Text>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historico de Pagamentos</Text>
          {subscription.payments.length === 0 ? (
            <Text style={styles.emptyPayments}>Nenhum pagamento registrado.</Text>
          ) : (
            subscription.payments.map((payment) => (
              <PaymentItem key={payment.id} payment={payment} />
            ))
          )}
        </View>

        {/* Cancel Button */}
        {subscription.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            <Text style={styles.cancelButtonText}>
              {isCancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
            </Text>
          </TouchableOpacity>
        )}

        {subscription.status === 'cancelled' && (
          <View style={styles.cancelledInfo}>
            <Text style={styles.cancelledText}>
              Assinatura cancelada. Acesso ativo ate {formatDate(subscription.current_period_end)}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },

  // Loading
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },

  // Error
  errorIcon: {
    fontSize: 48,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty state
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  plansButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  plansButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // Plan badge
  planBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  planBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Info card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSep: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  couponCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },

  // Payment item
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentLeft: {
    gap: 4,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  emptyPayments: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Cancel
  cancelButton: {
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },

  // Cancelled info
  cancelledInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
})
