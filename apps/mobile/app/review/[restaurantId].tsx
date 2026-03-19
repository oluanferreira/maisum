import { useState } from 'react'
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../services/supabase'

export default function ReviewScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>()
  const router = useRouter()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Avaliacao', 'Selecione pelo menos 1 estrela.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert('Erro', 'Voce precisa estar logado para avaliar.')
        setSubmitting(false)
        return
      }

      const { error: reviewError } = await supabase.from('reviews').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        rating,
        comment: comment.trim() || null,
      })

      if (reviewError) {
        Alert.alert('Erro', 'Nao foi possivel enviar sua avaliacao. Tente novamente.')
        setSubmitting(false)
        return
      }

      const { data: bonusResult, error: bonusError } = await supabase.rpc(
        'grant_extra_coupons',
        { p_user_id: user.id, p_count: 1, p_source: 'review' }
      )

      if (bonusError || bonusResult === false) {
        setSuccess(true)
        return
      }

      setSuccess(true)
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Obrigado!</Text>
          <Text style={styles.successMessage}>Voce ganhou +1 cupom!</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.back()}
          >
            <Text style={styles.submitButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Como foi sua experiencia?</Text>
        <Text style={styles.subtitle}>
          Avalie o restaurante e ganhe um cupom extra!
        </Text>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starTouchable}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.star,
                  { color: star <= rating ? '#FFCB47' : '#E5E7EB' },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment */}
        <TextInput
          style={styles.commentInput}
          placeholder="Deixe um comentario (opcional)"
          placeholderTextColor="#9CA3AF"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar e ganhar +1 cupom</Text>
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Avaliar depois</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
  starTouchable: {
    padding: 4,
  },
  star: {
    fontSize: 40,
  },
  commentInput: {
    width: '100%',
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A2E',
    minHeight: 100,
  },
  submitButton: {
    width: '100%',
    marginTop: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkMark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  successMessage: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '600',
  },
})
