'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Lead {
    id: string
    name: string
    phone: string
    address: string
    neighborhood: string
    city: string
    rating: number | null
    website: string | null
    email_1: string | null
    email_2: string | null
    status: string
}

interface Search {
    id: string
    term: string
    city: string
    status: string
    leads_count: number
    created_at: string
}

export default function SearchResultsPage() {
    const params = useParams()
    const searchId = params.id as string
    const supabase = createClient()

    const [search, setSearch] = useState<Search | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()

        // Realtime subscription for search status updates
        const searchChannel = supabase
            .channel(`search-${searchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'searches',
                    filter: `id=eq.${searchId}`,
                },
                (payload) => {
                    setSearch(payload.new as Search)
                    if (payload.new.status === 'concluido') {
                        fetchLeads()
                    }
                }
            )
            .subscribe()

        // Realtime subscription for new leads
        const leadsChannel = supabase
            .channel(`leads-${searchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'leads',
                    filter: `search_id=eq.${searchId}`,
                },
                (payload) => {
                    setLeads((prev) => [...prev, payload.new as Lead])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(searchChannel)
            supabase.removeChannel(leadsChannel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchId])

    async function fetchData() {
        setLoading(true)
        await Promise.all([fetchSearch(), fetchLeads()])
        setLoading(false)
    }

    async function fetchSearch() {
        const { data } = await supabase
            .from('searches')
            .select('*')
            .eq('id', searchId)
            .single()
        if (data) setSearch(data)
    }

    async function fetchLeads() {
        const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('search_id', searchId)
            .order('name')
        if (data) setLeads(data)
    }

    function formatPhone(phone: string) {
        if (!phone) return ''
        const clean = phone.replace(/\D/g, '')
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
        }
        return phone
    }

    function getWhatsAppLink(phone: string, businessName: string) {
        const clean = phone.replace(/\D/g, '')
        const number = clean.startsWith('55') ? clean : `55${clean}`
        const message = encodeURIComponent(
            `Olá! Encontrei a ${businessName} pelo Google Maps e gostaria de saber mais sobre os seus serviços.`
        )
        return `https://wa.me/${number}?text=${message}`
    }

    if (loading) {
        return (
            <div className="loading-page">
                <div className="loading-spinner" />
                <p>Carregando...</p>
            </div>
        )
    }

    if (!search) {
        return (
            <div className="empty-state">
                <div className="empty-icon">❌</div>
                <h3>Busca não encontrada</h3>
                <Link href="/dashboard" className="btn btn-primary">Voltar ao dashboard</Link>
            </div>
        )
    }

    return (
        <>
            <div className="page-header">
                <h1>
                    {search.term} em {search.city}
                </h1>
                <p>
                    <span className={`badge badge-${search.status}`}>{search.status}</span>
                    {' · '}
                    {leads.length} leads encontrados
                    {' · '}
                    {new Date(search.created_at).toLocaleDateString('pt-BR')}
                </p>
            </div>

            {search.status === 'processando' && (
                <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
                    <div className="loading-spinner" style={{ marginBottom: '1rem' }} />
                    <p>Buscando leads... Isso pode levar alguns minutos.</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Os resultados aparecerão automaticamente aqui.
                    </p>
                </div>
            )}

            {search.status === 'erro' && (
                <div className="error-message" style={{ marginBottom: '1.5rem' }}>
                    Ocorreu um erro durante a busca. Tente novamente.
                </div>
            )}

            {leads.length > 0 ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Nome</th>
                                <th style={{ width: '15%' }}>Telefone</th>
                                <th style={{ width: '10%' }}>Bairro</th>
                                <th style={{ width: '10%' }}>Avaliação</th>
                                <th style={{ width: '12%' }}>Website</th>
                                <th style={{ width: '13%' }}>E-mail</th>
                                <th style={{ width: '10%' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td data-label="Nome">
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                            {lead.name}
                                        </div>
                                    </td>
                                    <td data-label="Telefone">
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            {formatPhone(lead.phone)}
                                        </div>
                                    </td>
                                    <td data-label="Bairro">
                                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                            {lead.neighborhood || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Avaliação">
                                        {lead.rating ? (
                                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                                ⭐ {lead.rating}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td data-label="Website">
                                        {lead.website ? (
                                            <a
                                                href={lead.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--color-primary-light)', fontSize: '0.85rem' }}
                                            >
                                                Abrir
                                            </a>
                                        ) : '—'}
                                    </td>
                                    <td data-label="E-mail" style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
                                        {lead.email_1 || '—'}
                                    </td>
                                    <td data-label="">
                                        {lead.phone && (
                                            <a
                                                href={getWhatsAppLink(lead.phone, lead.name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-whatsapp"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                WhatsApp
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : search.status === 'concluido' ? (
                <div className="empty-state">
                    <div className="empty-icon">🤷</div>
                    <h3>Nenhum lead encontrado</h3>
                    <p>Tente buscar com termos diferentes ou outra cidade.</p>
                    <Link href="/search" className="btn btn-primary">Nova Busca</Link>
                </div>
            ) : null}
        </>
    )
}
