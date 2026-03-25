import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'
import { SearchBar } from '@/components/molecules/search-bar'
import { FilterChips } from '@/components/molecules/filter-chips'

interface Restaurant {
  id: string
  name: string
  cuisine_type: string | null
  is_active: boolean
  cities: { name: string } | null
  avg_rating: number | null
  review_count: number | null
  [key: string]: unknown
}

// --- Cuisine category config ---
const CUISINE_ICONS: Record<string, string> = {
  'Brasileira': '🇧🇷',
  'Italiana': '🍝',
  'Japonesa': '🍣',
  'Mexicana': '🌮',
  'Pizza': '🍕',
  'Pizzaria': '🍕',
  'Hamburguer': '🍔',
  'Hamburgueria': '🍔',
  'Churrasco': '🥩',
  'Churrascaria': '🥩',
  'Açaí': '🍇',
  'Padaria': '🥐',
  'Cafeteria': '☕',
  'Sorveteria': '🍦',
  'Doces': '🍰',
  'Saudável': '🥗',
  'Fit': '🥗',
  'Árabe': '🧆',
  'Chinesa': '🥡',
  'Frutos do Mar': '🦐',
  'Lanche': '🌭',
  'Pastelaria': '🥟',
  'Marmita': '🍱',
  'Self-service': '🍽️',
  'Vegana': '🌱',
  'Vegetariana': '🌱',
}

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonBlock, { height: 20, width: '60%', marginBottom: 8 }]} />
      <View style={[styles.skeletonBlock, { height: 14, width: '40%', marginBottom: 6 }]} />
      <View style={[styles.skeletonBlock, { height: 14, width: '50%' }]} />
    </View>
  )
}

// --- Restaurant Card ---
function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const hasRating = restaurant.avg_rating != null && restaurant.avg_rating > 0
  const ratingDisplay = hasRating ? Number(restaurant.avg_rating).toFixed(1) : null

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        {hasRating ? (
          <View style={styles.ratingContainer}>
            <Text style={styles.cardRating}>★ {ratingDisplay}</Text>
            {restaurant.review_count != null && restaurant.review_count > 0 && (
              <Text style={styles.reviewCount}>({restaurant.review_count})</Text>
            )}
          </View>
        ) : (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Novo</Text>
          </View>
        )}
      </View>
      {restaurant.cuisine_type && (
        <Text style={styles.cardCuisine}>{restaurant.cuisine_type}</Text>
      )}
      {restaurant.cities?.name && (
        <Text style={styles.cardCity}>{restaurant.cities.name}</Text>
      )}
    </TouchableOpacity>
  )
}

// --- Sort Options ---
const SORT_OPTIONS = ['Mais proximo', 'Melhor avaliado'] as const

export default function HomeScreen() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisineOptions, setCuisineOptions] = useState<string[]>([])
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState<string>(SORT_OPTIONS[0])

  const fetchRestaurants = useCallback(async () => {
    try {
      // TODO: Replace with a DB view (avg_rating, review_count) when data grows
      // to avoid fetching all reviews client-side.
      const { data, error } = await supabase
        .from('restaurants')
        .select('*, cities(name), reviews(rating)')
        .eq('is_active', true)
        .limit(100)

      if (error) throw error

      // Compute avg_rating and review_count from joined reviews
      const items = (data ?? []).map((r: Record<string, unknown>) => {
        const reviews = (r.reviews ?? []) as { rating: number }[]
        const reviewCount = reviews.length
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviewCount
          : null
        return {
          ...r,
          avg_rating: avgRating,
          review_count: reviewCount,
          reviews: undefined, // drop raw reviews from state
        }
      }) as Restaurant[]
      setRestaurants(items)

      // Extract distinct cuisine types for filter chips
      const cuisines = Array.from(
        new Set(items.map((r) => r.cuisine_type).filter(Boolean) as string[])
      ).sort()
      setCuisineOptions(cuisines)
    } catch (err) {
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchRestaurants()
    setRefreshing(false)
  }, [fetchRestaurants])

  const handleToggleCuisine = useCallback((cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    )
  }, [])

  const handleToggleSort = useCallback((sort: string) => {
    setSelectedSort(sort)
  }, [])

  // Filter restaurants by search + cuisine
  const filteredRestaurants = useMemo(() => {
    let result = restaurants

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }

    if (selectedCuisines.length > 0) {
      result = result.filter((r) => r.cuisine_type && selectedCuisines.includes(r.cuisine_type))
    }

    return result
  }, [restaurants, searchQuery, selectedCuisines])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.cityName}>Jequie, BA</Text>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>Restaurantes em Jequie, BA</Text>
        <Text style={styles.heroSubtitle}>
          {loading ? 'Carregando...' : `${restaurants.length} restaurante${restaurants.length !== 1 ? 's' : ''} disponive${restaurants.length !== 1 ? 'is' : 'l'}`}
        </Text>
      </View>

      {/* Cuisine Category Selector */}
      {cuisineOptions.length > 0 && (
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCuisines.length === 0 && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCuisines([])}
            >
              <Text style={styles.categoryIcon}>🍽️</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCuisines.length === 0 && styles.categoryLabelActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {cuisineOptions.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.categoryChip,
                  selectedCuisines.includes(cuisine) && styles.categoryChipActive,
                ]}
                onPress={() => handleToggleCuisine(cuisine)}
              >
                <Text style={styles.categoryIcon}>
                  {CUISINE_ICONS[cuisine] ?? '🍴'}
                </Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCuisines.includes(cuisine) && styles.categoryLabelActive,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Restaurant List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Sort Options */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.sortBtn, selectedSort === opt && styles.sortBtnActive]}
              onPress={() => handleToggleSort(opt)}
            >
              <Text style={[styles.sortText, selectedSort === opt && styles.sortTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Skeletons */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Restaurant Cards */}
        {!loading && filteredRestaurants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum restaurante encontrado</Text>
          </View>
        )}

        {!loading &&
          filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => router.push(`/restaurant/${restaurant.id}`)}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  topBarIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  // Hero Header
  heroHeader: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  // Category Selector
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    minWidth: 72,
  },
  categoryChipActive: {
    backgroundColor: '#FFF1EB',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#FF6B35',
  },
  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  // Sort
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  sortBtnActive: {
    backgroundColor: '#1A1A2E',
  },
  sortText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  cardCuisine: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cardCity: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
})
