import { Redirect } from 'expo-router'
import { useAuthStore } from '../stores/auth'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F5' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)" />
}
