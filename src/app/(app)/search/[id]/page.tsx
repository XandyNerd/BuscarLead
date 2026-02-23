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
    photo_url: string | null
    photos: string[]
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
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

    async function updateLeadStatus(leadId: string, newStatus: string) {
        // Optimistic UI update
        setLeads(current => current.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead({ ...selectedLead, status: newStatus })
        }

        try {
            await fetch('/api/leads/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_id: leadId, status: newStatus })
            })
        } catch (e) {
            console.error('Failed to update status', e)
        }
    }

    function handleWhatsAppClick(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
        e.preventDefault()
        if (selectedLead && selectedLead.status !== 'contatado') {
            updateLeadStatus(selectedLead.id, 'contatado')
        }
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    function handleCloseModal() {
        setSelectedLead(null)
        setCurrentPhotoIndex(0)
    }

    function handleOpenModal(lead: Lead) {
        setSelectedLead(lead)
        setCurrentPhotoIndex(0)
    }

    function handleNextPhoto(e: React.MouseEvent) {
        e.stopPropagation()
        if (selectedLead && selectedLead.photos?.length > 0) {
            setCurrentPhotoIndex((prev) => (prev + 1) % selectedLead.photos.length)
        }
    }

    function handlePrevPhoto(e: React.MouseEvent) {
        e.stopPropagation()
        if (selectedLead && selectedLead.photos?.length > 0) {
            setCurrentPhotoIndex((prev) => (prev - 1 + selectedLead.photos.length) % selectedLead.photos.length)
        }
    }

    useEffect(() => {
        fetchData()

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

    useEffect(() => {
        if (selectedLead) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [selectedLead])

    function getStatusBadge(status: string) {
        switch (status) {
            case 'contatado':
                return <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.7rem' }}>🟢 Contatado</span>
            case 'sem_interesse':
                return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.7rem' }}>🔴 Sem Interesse</span>
            case 'novo':
            default:
                return <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem' }}>🟡 Novo</span>
        }
    }

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
                <>
                    {/* Desktop: Table view */}
                    <div className="desktop-only">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '5%' }}></th>
                                        <th style={{ width: '25%' }}>Nome</th>
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
                                        <tr key={lead.id} onClick={() => handleOpenModal(lead)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className="lead-thumb">
                                                    {lead.photo_url ? (
                                                        <img src={lead.photo_url} alt={lead.name} />
                                                    ) : (
                                                        <span>📍</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                    {lead.name}
                                                    <div style={{ marginTop: '4px' }}>
                                                        {getStatusBadge(lead.status)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Telefone">
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                                    {formatPhone(lead.phone)}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                                    {lead.neighborhood || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                {lead.rating ? (
                                                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                                        ⭐ {lead.rating}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                {lead.website ? (
                                                    <a
                                                        href={lead.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--color-primary-light)', fontSize: '0.85rem' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Abrir
                                                    </a>
                                                ) : '—'}
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
                                                {lead.email_1 || '—'}
                                            </td>
                                            <td data-label="Ação">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenModal(lead)
                                                    }}
                                                >
                                                    Ver detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile: Photo cards grid */}
                    < div className="mobile-only lead-cards-grid" >
                        {
                            leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="lead-photo-card"
                                    onClick={() => handleOpenModal(lead)}
                                >
                                    <div className="lead-photo-card-img">
                                        {lead.photo_url ? (
                                            <img src={lead.photo_url} alt={lead.name} />
                                        ) : (
                                            <div className="lead-photo-placeholder">📍</div>
                                        )}
                                        {lead.rating && (
                                            <span className="lead-photo-rating">⭐ {lead.rating}</span>
                                        )}
                                    </div>
                                    <div className="lead-photo-card-info">
                                        <div className="lead-photo-card-name" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {lead.name}
                                            <div>{getStatusBadge(lead.status)}</div>
                                        </div>
                                        <div className="lead-photo-card-location">
                                            {lead.neighborhood || lead.city || '—'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div >
                </>
            ) : search.status === 'concluido' ? (
                <div className="empty-state">
                    <div className="empty-icon">🤷</div>
                    <h3>Nenhum lead encontrado</h3>
                    <p>Tente buscar com termos diferentes ou outra cidade.</p>
                    <Link href="/search" className="btn btn-primary">Nova Busca</Link>
                </div>
            ) : null
            }

            {/* Detail Modal */}
            {
                selectedLead && (
                    <>
                        <div className="lead-modal-overlay" onClick={handleCloseModal} />
                        <div className="lead-modal">
                            <button className="lead-modal-close" onClick={handleCloseModal}>✕</button>

                            {/* Photo header / Carousel */}
                            <div className="lead-modal-photo">
                                {selectedLead.photos && selectedLead.photos.length > 0 ? (
                                    <>
                                        <img src={selectedLead.photos[currentPhotoIndex]} alt={`${selectedLead.name} - foto ${currentPhotoIndex + 1}`} />
                                        {selectedLead.photos.length > 1 && (
                                            <>
                                                <button className="carousel-btn prev" onClick={handlePrevPhoto}>❮</button>
                                                <button className="carousel-btn next" onClick={handleNextPhoto}>❯</button>
                                                <div className="carousel-indicators">
                                                    {selectedLead.photos.map((_, idx) => (
                                                        <span key={idx} className={`indicator ${idx === currentPhotoIndex ? 'active' : ''}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : selectedLead.photo_url ? (
                                    <img src={selectedLead.photo_url} alt={selectedLead.name} />
                                ) : (
                                    <div className="lead-photo-placeholder lead-photo-placeholder-lg">📍</div>
                                )}
                            </div>

                            {/* Name + rating */}
                            <div className="lead-modal-header">
                                <div>
                                    <h2 style={{ marginBottom: '6px' }}>{selectedLead.name}</h2>
                                    {getStatusBadge(selectedLead.status)}
                                </div>
                                {selectedLead.rating && (
                                    <span className="lead-modal-rating">⭐ {selectedLead.rating}</span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="lead-modal-details">
                                {selectedLead.phone && (
                                    <div className="lead-modal-row">
                                        <span className="lead-modal-label">📞 Telefone</span>
                                        <span className="lead-modal-value">{formatPhone(selectedLead.phone)}</span>
                                    </div>
                                )}
                                {(() => {
                                    if (!selectedLead.address) return null
                                    const parts = selectedLead.address.split(',').map(p => p.trim())
                                    const cepMatch = selectedLead.address.match(/\d{5}-?\d{3}/)
                                    const cep = cepMatch ? cepMatch[0] : null
                                    const cleaned = parts.filter(p => !p.match(/brasil/i) && !p.match(/\d{5}-?\d{3}/))

                                    let street = cleaned[0] || null
                                    let bairro = null
                                    let cidadeEstado = null

                                    if (cleaned.length >= 3) {
                                        const part2 = cleaned[1] || ''
                                        const part3 = cleaned[2] || ''
                                        if (part2.includes(' - ')) {
                                            const sub = part2.split(' - ')
                                            street = cleaned[0] + ', ' + sub[0].trim()
                                            bairro = sub.slice(1).join(' - ').trim() || null
                                        } else {
                                            bairro = part2 || null
                                        }
                                        cidadeEstado = part3 || null
                                    } else if (cleaned.length === 2) {
                                        cidadeEstado = cleaned[1] || null
                                    }

                                    return (
                                        <>
                                            {street && (
                                                <div className="lead-modal-row">
                                                    <span className="lead-modal-label">🏠 Rua</span>
                                                    <span className="lead-modal-value">{street}</span>
                                                </div>
                                            )}
                                            {bairro && (
                                                <div className="lead-modal-row">
                                                    <span className="lead-modal-label">🏘️ Bairro</span>
                                                    <span className="lead-modal-value">{bairro}</span>
                                                </div>
                                            )}
                                            {cidadeEstado && (
                                                <div className="lead-modal-row">
                                                    <span className="lead-modal-label">🌆 Município</span>
                                                    <span className="lead-modal-value">{cidadeEstado}</span>
                                                </div>
                                            )}
                                            {cep && (
                                                <div className="lead-modal-row">
                                                    <span className="lead-modal-label">📮 CEP</span>
                                                    <span className="lead-modal-value">{cep}</span>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                                {selectedLead.website && (
                                    <div className="lead-modal-row">
                                        <span className="lead-modal-label">🌐 Website</span>
                                        <a
                                            href={selectedLead.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="lead-modal-link"
                                        >
                                            {selectedLead.website.replace(/^https?:\/\//, '').slice(0, 35)}
                                        </a>
                                    </div>
                                )}
                                {selectedLead.email_1 && (
                                    <div className="lead-modal-row">
                                        <span className="lead-modal-label">✉️ E-mail</span>
                                        <span className="lead-modal-value">{selectedLead.email_1}</span>
                                    </div>
                                )}
                                {selectedLead.email_2 && (
                                    <div className="lead-modal-row">
                                        <span className="lead-modal-label">✉️ E-mail 2</span>
                                        <span className="lead-modal-value">{selectedLead.email_2}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="lead-modal-actions">
                                {selectedLead.phone && (
                                    <a
                                        href={getWhatsAppLink(selectedLead.phone, selectedLead.name)}
                                        onClick={(e) => handleWhatsAppClick(e, getWhatsAppLink(selectedLead.phone, selectedLead.name))}
                                        className="btn-whatsapp lead-modal-btn"
                                    >
                                        💬 WhatsApp
                                    </a>
                                )}
                                {selectedLead.address && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-maps lead-modal-btn"
                                    >
                                        📍 Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </>
                )
            }
        </>
    )
}
