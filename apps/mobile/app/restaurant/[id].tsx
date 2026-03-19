import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
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
  is_active: boolean
}

interface BenefitRule {
  id: string
  available_days: number[]
  available_hours_start: string | null
  available_hours_end: string | null
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
  benefits: Benefit[] | null
  benefit_rules: BenefitRule[] | null
  [key: string]: unknown
}

// --- Helpers ---
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function formatDays(days: number[]): string {
  if (!days || days.length === 0) return ''
  return days.map((d) => DAY_NAMES[d] ?? '').join(', ')
}

function formatTime(time: string | null): string {
  if (!time) return ''
  return time.substring(0, 5)
}

function isBenefitAvailableNow(rules: BenefitRule[]): boolean {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

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
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function loadData() {
      try {
        const [restaurantRes, reviewsRes] = await Promise.all([
          supabase
            .from('restaurants')
            .select('*, cities(name), benefits(*), benefit_rules(*)')
            .eq('id', id)
            .single(),
          supabase
            .from('reviews')
            .select('*, profiles(full_name)')
            .eq('restaurant_id', id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (restaurantRes.error) throw restaurantRes.error
        setRestaurant(restaurantRes.data as unknown as Restaurant)

        if (!reviewsRes.error && reviewsRes.data) {
          setReviews(reviewsRes.data as unknown as Review[])
        }
      } catch (err) {
        console.error('Error loading restaurant:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const benefitAvailable = useMemo(() => {
    if (!restaurant?.benefit_rules) return false
    return isBenefitAvailableNow(restaurant.benefit_rules)
  }, [restaurant])

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
          <View style={[styles.statusBadge, !benefitAvailable && styles.statusBadgeGray]}>
            <View style={[styles.statusDot, !benefitAvailable && styles.statusDotGray]} />
            <Text style={[styles.statusText, !benefitAvailable && styles.statusTextGray]}>
              {benefitAvailable ? 'Disponivel agora' : 'Fora do horario'}
            </Text>
          </View>
        </View>

        {/* Benefit Section */}
        {restaurant.benefits && restaurant.benefits.length > 0 && (
          <View style={styles.benefitSection}>
            <Text style={styles.sectionTitle}>+um Beneficio</Text>
            <View style={styles.benefitCard}>
              {restaurant.benefits
                .filter((b) => b.is_active)
                .map((benefit) => (
                  <View key={benefit.id} style={styles.benefitItem}>
                    <Text style={styles.benefitName}>{benefit.name}</Text>
                    {benefit.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{benefit.category}</Text>
                      </View>
                    )}
                    {benefit.description && (
                      <Text style={styles.benefitDesc}>{benefit.description}</Text>
                    )}
                  </View>
                ))}

              {/* Rules / Schedule */}
              {restaurant.benefit_rules &&
                restaurant.benefit_rules.filter((r) => r.is_active).length > 0 && (
                  <View style={styles.rulesContainer}>
                    <Text style={styles.rulesLabel}>Horarios disponiveis:</Text>
                    {restaurant.benefit_rules
                      .filter((r) => r.is_active)
                      .map((rule) => (
                        <Text key={rule.id} style={styles.ruleText}>
                          {formatDays(rule.available_days)} · {formatTime(rule.available_hours_start)}{' '}
                          - {formatTime(rule.available_hours_end)}
                        </Text>
                      ))}
                  </View>
                )}
            </View>
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
          {/* Mini map placeholder */}
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

        {/* Spacer for bottom CTA */}
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  // Back
  backBtn: {
    position: 'absolute',
    top: 8,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  // Photo
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Header
  headerInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  ratingLine: {
    fontSize: 15,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  metaLine: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeGray: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusDotGray: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  statusTextGray: {
    color: '#9CA3AF',
  },
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  // Benefit
  benefitSection: {
    padding: 16,
  },
  benefitCard: {
    backgroundColor: '#FFF1EB',
    borderRadius: 12,
    padding: 16,
  },
  benefitItem: {
    marginBottom: 12,
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  benefitDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  rulesContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFD6C2',
    paddingTop: 8,
  },
  rulesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 13,
    color: '#1A1A2E',
    marginBottom: 2,
  },
  // About
  aboutSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  aboutText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoLine: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  phoneLine: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
    marginBottom: 12,
  },
  miniMapPlaceholder: {
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  miniMapText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Reviews
  reviewsSection: {
    padding: 16,
  },
  noReviews: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewStars: {
    fontSize: 14,
    color: '#F59E0B',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Bottom CTA
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  ctaButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 22,
  },
})
