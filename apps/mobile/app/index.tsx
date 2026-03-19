import { Text, View, StyleSheet } from 'react-native'

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>+um</Text>
      <Text style={styles.subtitle}>Pediu um, recebe +um!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F5' },
  title: { fontSize: 48, fontWeight: '700', color: '#FF6B35' },
  subtitle: { fontSize: 18, color: '#2D2D44', marginTop: 8 },
})
