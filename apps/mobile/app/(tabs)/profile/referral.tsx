import { useEffect, useState, useCallback } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { supabase } from '../../../services/supabase'

interface Referral {
  id: string
  status: 'pending' | 'completed'
  created_at: string
  referred: { full_name: string | null } | null
}

export default function ReferralScreen() {
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const referralLink = `maisumapp.com/ref/${referralCode}`
  const shareMessage = `Conhece o +um? Use meu link e a gente ganha cupons extras! ${referralLink}`

  const totalInvited = referrals.length
  const totalConverted = referrals.filter((r) => r.status === 'completed').length
  const totalCoupons = totalConverted * 3

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single()

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code)
      }

      const { data: refs } = await supabase
        .from('referrals')
        .select('id, status, created_at, referred:referred_id(full_name)')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (refs) {
        setReferrals(refs as unknown as Referral[])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCopy() {
    await Clipboard.setStringAsync(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      await Linking.openURL(url)
    }
  }

  async function handleShare() {
    await Share.share({ message: shareMessage })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function renderReferralItem({ item }: { item: Referral }) {
    const isCompleted = item.status === 'completed'
    return (
      <View style={styles.referralItem}>
        <View style={styles.referralInfo}>
          <Text style={styles.referralName}>
            {item.referred?.full_name || 'Convidado'}
          </Text>
          <Text style={styles.referralDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.referralBadges}>
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.badgeGreen : styles.badgeYellow,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted ? styles.badgeGreenText : styles.badgeYellowText,
              ]}
            >
              {isCompleted ? 'Convertido' : 'Pendente'}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.couponBadge}>
              <Text style={styles.couponBadgeText}>+3 cupons</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={referrals}
        keyExtractor={(item) => item.id}
        renderItem={renderReferralItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <Text style={styles.title}>Indica e Ganha!</Text>
            <Text style={styles.subtitle}>
              Indique amigos e ambos ganham 3 cupons extras!
            </Text>

            {/* Referral Link Card */}
            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>Seu link de indicacao</Text>
              <Text style={styles.linkText}>{referralLink}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Text style={styles.copyButtonText}>
                  {copied ? 'Copiado!' : 'Copiar link'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Share Buttons */}
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <Text style={styles.whatsappButtonText}>
                Compartilhar via WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.shareButtonText}>Compartilhar...</Text>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalInvited}</Text>
                <Text style={styles.statLabel}>Convidados</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalConverted}</Text>
                <Text style={styles.statLabel}>Convertidos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalCoupons}</Text>
                <Text style={styles.statLabel}>Cupons ganhos</Text>
              </View>
            </View>

            {/* Referral History Header */}
            {referrals.length > 0 && (
              <Text style={styles.sectionTitle}>Historico de indicacoes</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhuma indicacao ainda. Compartilhe seu link!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 24,
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
  },
  linkCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  linkText: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
    marginTop: 8,
  },
  copyButton: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  whatsappButton: {
    marginTop: 16,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    marginTop: 12,
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 32,
    marginBottom: 12,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  referralDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  referralBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  badgeYellowText: {
    color: '#D97706',
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeGreenText: {
    color: '#059669',
  },
  couponBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  couponBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})
