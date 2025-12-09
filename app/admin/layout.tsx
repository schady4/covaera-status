import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import Link from 'next/link'
import { ClerkProvider, UserButton } from '@clerk/nextjs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hasAccess = await isAdmin()

  if (!hasAccess) {
    redirect('/')
  }

  return (
    <ClerkProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-primary">
                Admin Dashboard
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Overview
                </Link>
                <Link
                  href="/admin/incidents"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Incidents
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View Status Page
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <main className="container mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </ClerkProvider>
  )
}
