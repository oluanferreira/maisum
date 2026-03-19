import { useState } from 'react'
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  function handleSendLink() {
    if (!email) {
      Alert.alert('Erro', 'Informe seu email')
      return
    }
    Alert.alert('Enviado', 'Verifique sua caixa de entrada')
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      <Text style={styles.subtitle}>
        Informe seu email para receber o link de recuperacao
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendLink}>
        <Text style={styles.buttonText}>Enviar link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Voltar para login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A2E',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
})
