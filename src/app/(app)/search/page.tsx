'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
    const [term, setTerm] = useState('')
    const [city, setCity] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term, city }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Erro ao iniciar busca.')
                setLoading(false)
                return
            }

            router.push(`/search/${data.id}`)
        } catch {
            setError('Erro de conexão. Tente novamente.')
            setLoading(false)
        }
    }

    return (
        <>
            <div className="page-header">
                <h1>🔍 Nova Busca</h1>
                <p>Digite o tipo de negócio e a cidade para encontrar leads.</p>
            </div>

            <div className="card search-form-card">
                <form className="auth-form" onSubmit={handleSearch}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="term">Tipo de Negócio</label>
                            <input
                                id="term"
                                type="text"
                                placeholder="Ex: dentistas, academias, restaurantes..."
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="city">Cidade</label>
                            <input
                                id="city"
                                type="text"
                                placeholder="Ex: Curitiba, São Paulo..."
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="loading-spinner" />
                                Iniciando busca...
                            </>
                        ) : (
                            '🚀 Buscar Leads'
                        )}
                    </button>
                </form>
            </div>
        </>
    )
}
