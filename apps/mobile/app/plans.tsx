import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '@/services/supabase'

type PlanType = 'monthly' | 'annual'

export default function PlansScreen() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectPlan = async (plan: PlanType) => {
    setSelectedPlan(plan)
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Login necessario', 'Faca login para assinar um plano.')
        router.push('/(auth)/login')
        return
      }

      // Call server-side Edge Function (API key never exposed to client)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_type: plan },
      })

      if (error) throw new Error(error.message || 'Erro ao criar cobranca')
      if (data?.error) throw new Error(data.error)

      // Open checkout URL in browser
      if (data?.checkout_url) {
        await Linking.openURL(data.checkout_url)
      } else {
        Alert.alert('Sucesso', 'Cobranca criada! Verifique seu email para o link de pagamento.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nao foi possivel iniciar o pagamento.'
      Alert.alert('Erro', message)
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Escolha seu plano</Text>
        <Text style={styles.subtitle}>Pediu um, recebeu +um</Text>

        {/* Plan Cards */}
        <View style={styles.cardsContainer}>
          {/* Annual Card - Highlighted */}
          <TouchableOpacity
            style={[styles.card, styles.cardAnnual]}
            activeOpacity={0.7}
            onPress={() => handleSelectPlan('annual')}
            disabled={isLoading}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Melhor Valor</Text>
            </View>
            <Text style={styles.cardTitle}>Anual</Text>
            <Text style={styles.cardPrice}>R$ 89,90</Text>
            <Text style={styles.cardPeriod}>/ano</Text>
            <View style={styles.divider} />
            <Text style={styles.cardBenefit}>100 cupons por ano</Text>
            <Text style={styles.cardDetail}>R$ 0,90 por cupom</Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Economize 45%</Text>
            </View>
            <TouchableOpacity
              style={[styles.cta, styles.ctaPrimary]}
              onPress={() => handleSelectPlan('annual')}
              disabled={isLoading}
            >
              <Text style={styles.ctaPrimaryText}>
                {isLoading && selectedPlan === 'annual' ? 'Carregando...' : 'Assinar Anual'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Monthly Card */}
          <TouchableOpacity
            style={[styles.card, styles.cardMonthly]}
            activeOpacity={0.7}
            onPress={() => handleSelectPlan('monthly')}
            disabled={isLoading}
          >
            <Text style={styles.cardTitle}>Mensal</Text>
            <Text style={styles.cardPrice}>R$ 14,90</Text>
            <Text style={styles.cardPeriod}>/mes</Text>
            <View style={styles.divider} />
            <Text style={styles.cardBenefit}>10 cupons por mes</Text>
            <Text style={styles.cardDetail}>R$ 1,49 por cupom</Text>
            <TouchableOpacity
              style={[styles.cta, styles.ctaSecondary]}
              onPress={() => handleSelectPlan('monthly')}
              disabled={isLoading}
            >
              <Text style={styles.ctaSecondaryText}>
                {isLoading && selectedPlan === 'monthly' ? 'Carregando...' : 'Assinar Mensal'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Cancele quando quiser. Cupons nao acumulam entre meses.
        </Text>

        {/* Payment methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentLabel}>Formas de pagamento aceitas:</Text>
          <View style={styles.paymentIcons}>
            <View style={styles.paymentChip}><Text style={styles.paymentChipText}>PIX</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  cardAnnual: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardMonthly: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badge: {
    backgroundColor: '#FFCB47',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  cardPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 4,
  },
  cardPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 16,
  },
  cardBenefit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  cardDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  savingsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
  },
  cta: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaPrimary: {
    backgroundColor: '#FF6B35',
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  finePrint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  paymentMethods: {
    marginTop: 24,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
})
