import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
  [key: string]: unknown
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
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cardRating}>★ 4.5</Text>
      </View>
      {restaurant.cuisine_type && (
        <Text style={styles.cardCuisine}>{restaurant.cuisine_type}</Text>
      )}
      {restaurant.cities?.name && (
        <Text style={styles.cardCity}>{restaurant.cities.name}</Text>
      )}
      <View style={styles.availableBadge}>
        <View style={styles.greenDot} />
        <Text style={styles.availableText}>Disponivel agora</Text>
      </View>
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
      const { data, error } = await supabase
        .from('restaurants')
        .select('*, cities(name)')
        .eq('is_active', true)

      if (error) throw error

      const items = (data ?? []) as Restaurant[]
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

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Mapa - Requer Google Maps API Key</Text>
      </View>

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

        {/* Cuisine Filter Chips */}
        {cuisineOptions.length > 0 && (
          <FilterChips
            options={cuisineOptions}
            selected={selectedCuisines}
            onToggle={handleToggleCuisine}
          />
        )}

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
  // Map
  mapPlaceholder: {
    height: '40%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
  cardRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
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
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  availableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
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
