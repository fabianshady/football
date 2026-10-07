'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Users, Wallet } from 'lucide-react'

export function SiteNav() {
  const pathname = usePathname()
  return <nav aria-label="Navegación principal" className="site-nav">
    {[{ href: '/', label: 'Inicio', icon: House }, { href: '/plantilla', label: 'Plantilla', icon: Users }, { href: '/finanzas', label: 'Finanzas', icon: Wallet }].map(({ href, label, icon: Icon }) =>
      <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}><Icon size={18} aria-hidden="true" /><span>{label}</span></Link>
    )}
  </nav>
}
