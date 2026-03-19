import { Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'

export default function ReviewScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Avaliar</Text>
      <Text style={styles.subtitle}>Como foi sua experiencia?</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
})
