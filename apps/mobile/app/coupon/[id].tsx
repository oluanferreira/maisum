import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'

// --- Types ---
interface Coupon {
  id: string
  user_id: string
  restaurant_id: string | null
  status: string
}

interface Restaurant {
  id: string
  name: string
}

// --- Screen ---
export default function QRCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [alreadyUsed, setAlreadyUsed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load coupon eligibility data
  useEffect(() => {
    if (!id) return

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load restaurant info
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('id', id)
          .single()

        if (restaurantData) {
          setRestaurant(restaurantData)
        }

        // Check if user already used a coupon at this restaurant
        const { data: usedCoupons } = await supabase
          .from('coupons')
          .select('id')
          .eq('user_id', user.id)
          .eq('restaurant_id', id)
          .eq('status', 'used')
          .limit(1)

        if (usedCoupons && usedCoupons.length > 0) {
          setAlreadyUsed(true)
          setLoading(false)
          return
        }

        // Check if user has an available coupon
        const { data: availableCoupons } = await supabase
          .from('coupons')
          .select('id, user_id, restaurant_id, status')
          .eq('user_id', user.id)
          .eq('status', 'available')
          .limit(1)

        if (availableCoupons && availableCoupons.length > 0) {
          setCoupon(availableCoupons[0])
        }
      } catch (err) {
        console.error('Error loading coupon data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // Timer countdown
  useEffect(() => {
    if (!coupon || expired) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [coupon, expired])

  // Regenerate handler
  const handleRegenerate = useCallback(() => {
    setTimeLeft(15 * 60)
    setExpired(false)
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Timer color based on remaining time
  const getTimerColor = (): string => {
    if (timeLeft < 60) return '#EF4444'
    if (timeLeft < 5 * 60) return '#F59E0B'
    return '#1A1A2E'
  }

  // --- Loading ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    )
  }

  // --- Already used at this restaurant ---
  if (alreadyUsed) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Cupom ja utilizado</Text>
          <Text style={styles.errorSubtitle}>
            Voce ja usou um cupom neste restaurante neste periodo.
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- No coupon available ---
  if (!coupon) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>0</Text>
          <Text style={styles.errorTitle}>Sem cupons disponiveis</Text>
          <Text style={styles.errorSubtitle}>
            Voce nao tem cupons disponiveis no momento. Assine um plano para
            receber novos cupons.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/plans' as never)}
          >
            <Text style={styles.primaryBtnText}>Ver Planos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- QR Code Display ---
  const truncatedId = coupon.id.substring(0, 8).toUpperCase()

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Voltar</Text>
      </TouchableOpacity>

      <View style={styles.qrContent}>
        {/* Restaurant name */}
        <Text style={styles.restaurantName}>
          {restaurant?.name ?? 'Restaurante'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Seu cupom +um</Text>

        {/* QR Code */}
        <View style={[styles.qrPlaceholder, expired && styles.qrExpired]}>
          <QRCode
            value={coupon.id}
            size={200}
            backgroundColor="#FFFFFF"
            color="#1A1A2E"
          />
          <Text style={styles.qrSubText}>{truncatedId}</Text>
        </View>

        {/* Instruction */}
        <Text style={styles.instruction}>
          Apresente este codigo ao restaurante
        </Text>

        {/* Timer */}
        <Text style={[styles.timer, { color: getTimerColor() }]}>
          {expired ? '00:00' : formatTime(timeLeft)}
        </Text>

        {/* Validity info */}
        <Text style={styles.validityText}>
          {expired ? 'Cupom expirado' : 'Valido por 15 minutos'}
        </Text>

        {/* Regenerate button (visible when expired) */}
        {expired && (
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={handleRegenerate}
          >
            <Text style={styles.regenerateBtnText}>Regenerar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  // Error / empty states
  errorIcon: {
    fontSize: 48,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 16,
    width: 80,
    height: 80,
    lineHeight: 80,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 40,
    overflow: 'hidden',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  // QR Code display
  qrContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#1A1A2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  qrExpired: {
    opacity: 0.3,
  },
  qrIdText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 2,
  },
  qrSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  validityText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  regenerateBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  regenerateBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
})
