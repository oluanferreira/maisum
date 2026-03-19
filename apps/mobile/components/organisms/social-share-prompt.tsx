import { useState } from 'react'
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../../services/supabase'

interface SocialSharePromptProps {
  restaurantName: string
  restaurantId: string
  onDismiss: () => void
}

export default function SocialSharePrompt({
  restaurantName,
  restaurantId,
  onDismiss,
}: SocialSharePromptProps) {
  const [proofLink, setProofLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const shareText = `Pedi um, recebi +um! @maisumapp @${restaurantName}`

  async function handleShare() {
    await Share.share({ message: shareText })
  }

  async function handleSubmitProof() {
    if (!proofLink.trim()) {
      Alert.alert('Link necessario', 'Cole o link do seu post para enviar a prova.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert('Erro', 'Voce precisa estar logado.')
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('social_proofs').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        proof_type: 'link',
        proof_url: proofLink.trim(),
      })

      if (error) {
        Alert.alert('Erro', 'Nao foi possivel enviar a prova. Tente novamente.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Prova enviada!</Text>
          <Text style={styles.successMessage}>
            Voce recebera o cupom extra apos a aprovacao.
          </Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compartilhe e ganhe +1 cupom!</Text>
      <Text style={styles.subtitle}>
        Poste no Instagram ou TikTok marcando @maisumapp e o restaurante.
      </Text>

      {/* Share Button */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Text style={styles.shareButtonText}>Compartilhar agora</Text>
      </TouchableOpacity>

      {/* Proof Section */}
      <Text style={styles.proofLabel}>Ja postou? Envie a prova:</Text>

      <TextInput
        style={styles.linkInput}
        placeholder="Cole o link do seu post aqui"
        placeholderTextColor="#9CA3AF"
        value={proofLink}
        onChangeText={setProofLink}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmitProof}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar prova</Text>
        )}
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.skipButton}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Pular</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareButton: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  proofLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 8,
  },
  linkInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#1A1A2E',
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#1B998B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
})
