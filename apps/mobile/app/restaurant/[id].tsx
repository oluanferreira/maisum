import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'

// --- Types ---
interface Benefit {
  id: string
  name: string
  category: string | null
  description: string | null
  photo_url: string | null
  original_price: number | null
  promo_description: string | null
  is_active: boolean
}

interface BenefitRule {
  id: string
  benefit_id: string | null
  available_days: number[]
  available_hours_start: string | null
  available_hours_end: string | null
  daily_limit: number | null
  is_active: boolean
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string | null } | null
}

interface Restaurant {
  id: string
  name: string
  cuisine_type: string | null
  description: string | null
  address: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  cities: { name: string } | null
  [key: string]: unknown
}

// --- Helpers ---
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const CATEGORY_EMOJI: Record<string, string> = {
  prato: '🍽️',
  drink: '🥤',
  sobremesa: '🍰',
  combo: '🎁',
}

function formatDays(days: number[]): string {
  if (!days || days.length === 0) return ''
  if (days.length === 7) return 'Todos os dias'
  return days.map((d) => DAY_NAMES[d] ?? '').join(', ')
}

function formatTime(time: string | null): string {
  if (!time) return ''
  return time.substring(0, 5)
}

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

function isBenefitAvailableNow(rules: BenefitRule[]): boolean {
  if (rules.length === 0) return true
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`

  return rules.some(
    (rule) =>
      rule.is_active &&
      rule.available_days?.includes(currentDay) &&
      currentTime >= (rule.available_hours_start ?? '') &&
      currentTime <= (rule.available_hours_end ?? '')
  )
}

function renderStars(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// --- Screen ---
export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [rules, setRules] = useState<BenefitRule[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return

    async function loadData() {
      try {
        const [restaurantRes, benefitsRes, rulesRes, reviewsRes] = await Promise.all([
          supabase
            .from('restaurants')
            .select('*, cities(name)')
            .eq('id', id)
            .single(),
          supabase
            .from('benefits')
            .select('*')
            .eq('restaurant_id', id)
            .eq('is_active', true)
            .order('created_at', { ascending: true }),
          supabase
            .from('benefit_rules')
            .select('*')
            .eq('restaurant_id', id)
            .eq('is_active', true),
          supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('restaurant_id', id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (restaurantRes.error) throw restaurantRes.error
        setRestaurant(restaurantRes.data as unknown as Restaurant)

        if (benefitsRes.error) console.error('Benefits load error:', benefitsRes.error)
        else if (benefitsRes.data) setBenefits(benefitsRes.data as unknown as Benefit[])

        if (rulesRes.error) console.error('Rules load error:', rulesRes.error)
        else if (rulesRes.data) setRules(rulesRes.data as unknown as BenefitRule[])

        if (reviewsRes.error) console.error('Reviews load error:', reviewsRes.error)
        else if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[])
      } catch (err) {
        console.error('Error loading restaurant:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // Build rules map: benefit_id → rules[], plus global fallback
  const { rulesForBenefit, anyAvailableNow } = useMemo(() => {
    const perBenefit = new Map<string, BenefitRule[]>()
    const globalRules: BenefitRule[] = []

    for (const rule of rules) {
      if (rule.benefit_id) {
        const arr = perBenefit.get(rule.benefit_id) || []
        arr.push(rule)
        perBenefit.set(rule.benefit_id, arr)
      } else {
        globalRules.push(rule)
      }
    }

    const getRules = (benefitId: string): BenefitRule[] => {
      return perBenefit.get(benefitId) || globalRules
    }

    const anyNow = benefits.some((b) => isBenefitAvailableNow(getRules(b.id)))

    return { rulesForBenefit: getRules, anyAvailableNow: anyNow }
  }, [benefits, rules])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    )
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Restaurante nao encontrado</Text>
      </SafeAreaView>
    )
  }

  const cityName = restaurant.cities?.name ?? ''

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>

        {/* Photo Placeholder */}
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoText}>Foto do Restaurante</Text>
        </View>

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.ratingLine}>
            ★ {avgRating > 0 ? avgRating : '--'} ({reviews.length} avaliacoes)
          </Text>
          <Text style={styles.metaLine}>
            {restaurant.cuisine_type ?? 'Variado'}
            {cityName ? ` · ${cityName}` : ''}
          </Text>
          <View style={[styles.statusBadge, !anyAvailableNow && styles.statusBadgeGray]}>
            <View style={[styles.statusDot, !anyAvailableNow && styles.statusDotGray]} />
            <Text style={[styles.statusText, !anyAvailableNow && styles.statusTextGray]}>
              {anyAvailableNow ? 'Disponivel agora' : 'Fora do horario'}
            </Text>
          </View>
        </View>

        {/* Benefits Section */}
        {benefits.length > 0 && (
          <View style={styles.benefitSection}>
            <Text style={styles.sectionTitle}>+um Cardapio</Text>
            {benefits.map((benefit) => {
              const benefitRules = rulesForBenefit(benefit.id)
              const isAvailable = isBenefitAvailableNow(benefitRules)

              return (
                <View key={benefit.id} style={[styles.benefitCard, !isAvailable && styles.benefitCardGray]}>
                  {/* Photo */}
                  {benefit.photo_url && !brokenImages.has(benefit.id) ? (
                    <Image
                      source={{ uri: benefit.photo_url }}
                      style={styles.benefitPhoto}
                      onError={() => setBrokenImages((prev) => new Set(prev).add(benefit.id))}
                    />
                  ) : (
                    <View style={styles.benefitPhotoPlaceholder}>
                      <Text style={styles.benefitPhotoEmoji}>
                        {CATEGORY_EMOJI[benefit.category || 'prato'] || '🍽️'}
                      </Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.benefitInfo}>
                    <View style={styles.benefitHeader}>
                      <Text style={styles.benefitName} numberOfLines={1}>{benefit.name}</Text>
                      {benefit.category && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{benefit.category}</Text>
                        </View>
                      )}
                    </View>

                    {benefit.description && (
                      <Text style={styles.benefitDesc} numberOfLines={2}>{benefit.description}</Text>
                    )}

                    {/* Price + Promo */}
                    <View style={styles.priceRow}>
                      {benefit.original_price != null && benefit.original_price > 0 && (
                        <Text style={styles.priceText}>{formatPrice(benefit.original_price)}</Text>
                      )}
                      {benefit.promo_description && (
                        <View style={styles.promoBadge}>
                          <Text style={styles.promoText}>{benefit.promo_description}</Text>
                        </View>
                      )}
                    </View>

                    {/* Per-benefit rules */}
                    {benefitRules.length > 0 && (
                      <View style={styles.ruleRow}>
                        <Text style={styles.ruleText}>
                          {formatDays(benefitRules[0].available_days)}
                          {' · '}
                          {formatTime(benefitRules[0].available_hours_start)} - {formatTime(benefitRules[0].available_hours_end)}
                        </Text>
                        <View style={[styles.availBadge, !isAvailable && styles.availBadgeGray]}>
                          <Text style={[styles.availText, !isAvailable && styles.availTextGray]}>
                            {isAvailable ? 'Disponivel' : 'Indisponivel'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          {restaurant.description && (
            <Text style={styles.aboutText}>{restaurant.description}</Text>
          )}
          {restaurant.address && (
            <Text style={styles.infoLine}>📍 {restaurant.address}</Text>
          )}
          {restaurant.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}>
              <Text style={styles.phoneLine}>📞 {restaurant.phone}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.miniMapPlaceholder}>
            <Text style={styles.miniMapText}>Ver no mapa</Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Avaliacoes ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Ainda sem avaliacoes</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    {review.profiles?.full_name ?? 'Usuario'}
                  </Text>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
                <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push(`/coupon/${id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Usar Cupom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} activeOpacity={0.7}>
          <Text style={styles.chatIcon}>💬</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  errorText: { fontSize: 16, color: '#9CA3AF' },

  // Back
  backBtn: {
    position: 'absolute', top: 8, left: 16, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },

  // Photo
  photoPlaceholder: {
    width: '100%', height: 200, backgroundColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  photoText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },

  // Header
  headerInfo: { padding: 16, backgroundColor: '#FFFFFF' },
  restaurantName: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  ratingLine: { fontSize: 15, color: '#F59E0B', fontWeight: '600', marginTop: 4 },
  metaLine: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#ECFDF5', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusBadgeGray: { backgroundColor: '#F3F4F6' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  statusDotGray: { backgroundColor: '#9CA3AF' },
  statusText: { fontSize: 13, color: '#10B981', fontWeight: '500' },
  statusTextGray: { color: '#9CA3AF' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },

  // Benefits
  benefitSection: { padding: 16 },
  benefitCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  benefitCardGray: { opacity: 0.65 },
  benefitPhoto: { width: 100, height: 100 },
  benefitPhotoPlaceholder: {
    width: 100, height: 100, backgroundColor: '#FFF1EB',
    justifyContent: 'center', alignItems: 'center',
  },
  benefitPhotoEmoji: { fontSize: 32 },
  benefitInfo: { flex: 1, padding: 10, justifyContent: 'center' },
  benefitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  benefitName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', flex: 1 },
  categoryBadge: {
    backgroundColor: '#FF6B35', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6,
  },
  categoryText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  benefitDesc: { fontSize: 13, color: '#6B7280', marginBottom: 4, lineHeight: 17 },

  // Price + Promo
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  priceText: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  promoBadge: {
    backgroundColor: '#ECFDF5', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  promoText: { fontSize: 11, fontWeight: '600', color: '#059669' },

  // Per-benefit rules
  ruleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ruleText: { fontSize: 11, color: '#9CA3AF' },
  availBadge: {
    backgroundColor: '#ECFDF5', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  availBadgeGray: { backgroundColor: '#F3F4F6' },
  availText: { fontSize: 10, fontWeight: '600', color: '#10B981' },
  availTextGray: { color: '#9CA3AF' },

  // About
  aboutSection: { padding: 16, backgroundColor: '#FFFFFF' },
  aboutText: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  infoLine: { fontSize: 14, color: '#374151', marginBottom: 8 },
  phoneLine: { fontSize: 14, color: '#FF6B35', fontWeight: '500', marginBottom: 12 },
  miniMapPlaceholder: {
    height: 100, backgroundColor: '#E5E7EB', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  miniMapText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  // Reviews
  reviewsSection: { padding: 16 },
  noReviews: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  reviewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },
  reviewStars: { fontSize: 14, color: '#F59E0B', marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20 },

  // Bottom CTA
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 10,
  },
  ctaButton: {
    flex: 1, height: 52, backgroundColor: '#FF6B35', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  chatButton: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  chatIcon: { fontSize: 22 },
})
