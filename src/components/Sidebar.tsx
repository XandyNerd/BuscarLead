'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileOpen, setMobileOpen] = useState(false)

    // Close drawer on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    async function handleLogout() {
        setMobileOpen(false)
        await supabase.auth.signOut()
        router.push('/login')
    }

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/search', label: 'Nova Busca', icon: '🔍' },
        { href: '/leads', label: 'Meus Leads', icon: '👥' },
    ]

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + '/')

    const navContent = (
        <>
            <nav className="sidebar-nav">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={isActive(link.href) ? 'active' : ''}
                        onClick={() => setMobileOpen(false)}
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
        </>
    )

    return (
        <>
            {/* Desktop Sidebar — hidden on mobile via CSS */}
            <aside className="sidebar">
                <div className="sidebar-logo">BuscaLead</div>
                {navContent}
            </aside>

            {/* Mobile: Top bar with hamburger — hidden on desktop via CSS */}
            <header className="mobile-header">
                <span className="mobile-header-logo">BuscaLead</span>
                <button
                    className="mobile-hamburger"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Abrir menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </header>

            {/* Mobile: Overlay + Drawer — ONLY rendered when open */}
            {mobileOpen && (
                <>
                    <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
                    <aside className="mobile-drawer">
                        <div className="mobile-drawer-header">
                            <span className="sidebar-logo">BuscaLead</span>
                            <button
                                className="mobile-drawer-close"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Fechar menu"
                            >
                                ✕
                            </button>
                        </div>
                        {navContent}
                    </aside>
                </>
            )}
        </>
    )
}
