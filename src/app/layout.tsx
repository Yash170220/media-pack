import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'
import { Roboto } from 'next/font/google'
import { cn } from '@/lib/utils'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Markentine — AI Content Intelligence',
  description: 'Turn any headline into a full media pack',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', roboto.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
