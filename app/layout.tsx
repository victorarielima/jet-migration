import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { MigrationProvider } from '@/context/migration-context'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  title: 'Jet Migration',
  description: 'Migre templates de WhatsApp entre apps da Gupshup com facilidade.',
  icons: {
    icon: [
      { url: '/logo-reduzida.png', type: 'image/png' },
    ],
    shortcut: '/logo-reduzida.png',
    apple: '/logo-reduzida.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <MigrationProvider>
          {children}
          <Toaster position="top-right" richColors />
        </MigrationProvider>
        <Analytics />
      </body>
    </html>
  )
}
