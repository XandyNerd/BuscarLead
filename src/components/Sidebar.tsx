'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/search', label: 'Nova Busca', icon: '🔍' },
        { href: '/leads', label: 'Meus Leads', icon: '👥' },
    ]

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">BuscaLead</div>
            <nav className="sidebar-nav">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={pathname === link.href || pathname.startsWith(link.href + '/') ? 'active' : ''}
                    >
                        <span className="nav-icon">{link.icon}</span>
                        {link.label}
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
                    🚪 Sair
                </button>
            </div>
        </aside>
    )
}
