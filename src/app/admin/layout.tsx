'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoginPage) return

    getSupabaseClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.push('/admin/login')
          return
        }
        setChecking(false)
      })
  }, [pathname, router, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axium-bg">
        <p className="text-axium-muted">Verificando acesso...</p>
      </div>
    )
  }

  return <>{children}</>
}
