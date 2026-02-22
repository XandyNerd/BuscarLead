'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RepeatSearchButton({ searchId }: { searchId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleRepeat() {
        if (!confirm('Esta ação apagará os leads antigos desta busca e iniciará uma nova coleta do zero. Deseja continuar?')) return

        setLoading(true)
        try {
            const res = await fetch('/api/searches/repeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search_id: searchId })
            })

            if (res.ok) {
                router.push(`/search/${searchId}`)
            } else {
                const data = await res.json()
                alert(data.error || 'Erro ao reiniciar busca')
                setLoading(false)
            }
        } catch {
            alert('Erro de conexão')
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleRepeat}
            disabled={loading}
            className="btn btn-sm"
            style={{
                marginLeft: '0.5rem',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
            }}
            title="Apagar leads antigos e refazer a busca"
        >
            {loading ? '⏳' : '🔄 Refazer'}
        </button>
    )
}
