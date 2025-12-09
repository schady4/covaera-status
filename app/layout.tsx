import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Covaera Status',
  description: 'Real-time status and uptime monitoring for Covaera platform',
  openGraph: {
    title: 'Covaera Status',
    description: 'Real-time status and uptime monitoring for Covaera platform',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <a href="/" className="flex items-center gap-2">
                <Image
                  src="/covaera-logo.svg"
                  alt="Covaera"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="font-semibold">Covaera Status</span>
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="https://covaera.com"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Main Site
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="container mx-auto max-w-5xl px-4 py-8">
              {children}
            </div>
          </main>
          <footer className="border-t py-6">
            <div className="container mx-auto max-w-5xl px-4">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Covaera. All rights reserved.
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <a href="/history" className="hover:text-foreground">
                    Incident History
                  </a>
                  <a
                    href="https://covaera.com/contact"
                    className="hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
