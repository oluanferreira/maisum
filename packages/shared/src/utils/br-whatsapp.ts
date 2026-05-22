const VALID_BRAZIL_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
])

function nationalDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) return digits.slice(2)
  return digits.slice(0, 11)
}

export function maskBrazilWhatsapp(value: string): string {
  const digits = nationalDigits(value)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function normalizeBrazilWhatsapp(value?: string | null): string | null {
  const raw = value?.trim() ?? ''
  if (!raw) return null

  const digits = nationalDigits(raw)
  if (digits.length !== 11) throw new Error('WhatsApp deve ter DDD e 9 digitos.')
  if (!VALID_BRAZIL_DDDS.has(digits.slice(0, 2))) {
    throw new Error('WhatsApp com DDD invalido para o Brasil.')
  }
  if (digits[2] !== '9') throw new Error('WhatsApp deve usar numero celular com 9 digitos.')

  return `+55${digits}`
}

export function isValidBrazilWhatsapp(value?: string | null): boolean {
  try {
    normalizeBrazilWhatsapp(value)
    return true
  } catch {
    return false
  }
}
