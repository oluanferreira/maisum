import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: '+um — Admin',
  description: 'Painel administrativo do +um',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${inter.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
