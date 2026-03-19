import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'

// --- Types ---
type TabStatus = 'available' | 'used' | 'expired'

interface CouponItem {
  id: string
  status: string
  source: string | null
  created_at: string
  used_at: string | null
  expires_at: string | null
  restaurant_id: string | null
  restaurants: { name: string } | null
}

// --- Source badge config ---
const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  referral: { label: 'Indicacao', color: '#3B82F6' },
  review: { label: 'Avaliacao', color: '#22C55E' },
  social: { label: 'Post', color: '#8B5CF6' },
}

// --- Screen ---
export default function CouponsScreen() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabStatus>('available')
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Summary stats
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [totalAll, setTotalAll] = useState(0)
  const [extras, setExtras] = useState(0)

  // Load coupons for active tab
  const loadCoupons = useCallback(async (tab: TabStatus, isRefresh = false) => {
    if (!isRefresh) setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load coupons for current tab
      const { data } = await supabase
        .from('coupons')
        .select('*, restaurants(name)')
        .eq('user_id', user.id)
        .eq('status', tab)
        .order('created_at', { ascending: false })

      if (data) {
        setCoupons(data as unknown as CouponItem[])
      }

      // Load summary stats (only on initial load or refresh)
      if (!isRefresh || tab === 'available') {
        const [availRes, usedRes, allRes, extrasRes] = await Promise.all([
          supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'available'),
          supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'used'),
          supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'available')
            .neq('source', 'subscription'),
        ])

        setTotalAvailable(availRes.count ?? 0)
        setTotalUsed(usedRes.count ?? 0)
        setTotalAll(allRes.count ?? 0)
        setExtras(extrasRes.count ?? 0)
      }
    } catch (err) {
      console.error('Error loading coupons:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadCoupons(activeTab)
  }, [activeTab, loadCoupons])

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadCoupons(activeTab, true)
  }, [activeTab, loadCoupons])

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Progress calculation
  const progressUsed = totalAll > 0 ? totalUsed / totalAll : 0

  // Tabs
  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'available', label: 'Disponiveis' },
    { key: 'used', label: 'Usados' },
    { key: 'expired', label: 'Expirados' },
  ]

  // Empty state messages
  const emptyMessages: Record<TabStatus, string> = {
    available: 'Nenhum cupom disponivel no momento',
    used: 'Voce ainda nao usou nenhum cupom',
    expired: 'Nenhum cupom expirado',
  }

  // Render coupon card
  const renderCoupon = ({ item }: { item: CouponItem }) => {
    const isAvailable = item.status === 'available'
    const isUsed = item.status === 'used'
    const isExpired = item.status === 'expired'
    const sourceBadge = item.source && item.source !== 'subscription'
      ? SOURCE_BADGES[item.source]
      : null

    return (
      <View style={[
        styles.couponCard,
        isAvailable && styles.couponCardAvailable,
        isUsed && styles.couponCardUsed,
        isExpired && styles.couponCardExpired,
      ]}>
        <View style={styles.couponContent}>
          <View style={styles.couponInfo}>
            <Text style={styles.couponRestaurant}>
              {item.restaurants?.name ?? (isAvailable ? 'Cupom disponivel' : 'Restaurante')}
            </Text>

            {isAvailable && (
              <Text style={styles.couponStatus}>Disponivel</Text>
            )}
            {isUsed && item.used_at && (
              <Text style={styles.couponDate}>
                Usado em {formatDate(item.used_at)}
              </Text>
            )}
            {isExpired && item.expires_at && (
              <Text style={styles.couponExpiredText}>
                Expirado em {formatDate(item.expires_at)}
              </Text>
            )}

            {sourceBadge && (
              <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.color + '20' }]}>
                <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>
                  {sourceBadge.label}
                </Text>
              </View>
            )}
          </View>

          {isAvailable && (
            <TouchableOpacity
              style={styles.useBtn}
              onPress={() => {
                if (item.restaurant_id) {
                  router.push(`/coupon/${item.restaurant_id}`)
                }
              }}
            >
              <Text style={styles.useBtnText}>Usar →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header card with progress */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>
          {totalAvailable} de {totalAll} cupons restantes
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progressUsed * 100, 100)}%` }]} />
        </View>
        {extras > 0 && (
          <Text style={styles.extrasText}>
            +{extras} extras disponiveis
          </Text>
        )}
      </View>

      {/* Segmented control */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Coupon list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id}
          renderItem={renderCoupon}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B35"
              colors={['#FF6B35']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{emptyMessages[activeTab]}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Header card
  headerCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  extrasText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFCB47',
    marginTop: 8,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  // Coupon card
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  couponCardAvailable: {
    borderLeftColor: '#FF6B35',
  },
  couponCardUsed: {
    borderLeftColor: '#9CA3AF',
  },
  couponCardExpired: {
    borderLeftColor: '#EF4444',
  },
  couponContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInfo: {
    flex: 1,
    marginRight: 12,
  },
  couponRestaurant: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  couponStatus: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '500',
  },
  couponDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  couponExpiredText: {
    fontSize: 12,
    color: '#EF4444',
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  useBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  useBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})
