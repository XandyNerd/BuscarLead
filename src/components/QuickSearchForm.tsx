'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function QuickSearchForm() {
    const [term, setTerm] = useState('')
    const [city, setCity] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term, city }),
            })
            const data = await res.json()
            if (res.ok) {
                router.push(`/search/${data.id}`)
            } else {
                alert(data.error || 'Erro ao iniciar busca.')
                setLoading(false)
            }
        } catch {
            alert('Erro de conexão. Tente novamente.')
            setLoading(false)
        }
    }

    return (
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                ⚡ Busca Rápida
            </h3>
            <form className="quick-search-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="O que buscar? (ex: padarias, oficinas)"
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    required
                    className="quick-search-input"
                />
                <input
                    type="text"
                    placeholder="Onde? (ex: São Paulo - SP, Curitiba)"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                    className="quick-search-input"
                />
                <button type="submit" className="btn btn-primary quick-search-btn" disabled={loading}>
                    {loading ? <span className="loading-spinner" style={{ width: '1rem', height: '1rem' }} /> : '🚀 Buscar Leads'}
                </button>
            </form>
        </div>
    )
}
