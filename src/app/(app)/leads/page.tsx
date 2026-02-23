'use client'

import { useEffect, useState } from 'react'
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
    searches: {
        term: string
        city: string
    }
}

export default function LeadsPage() {
    const supabase = createClient()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

    useEffect(() => {
        fetchLeads()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (selectedLead) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [selectedLead])

    async function fetchLeads() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('leads')
            .select('*, searches(term, city)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100)

        if (data) setLeads(data as unknown as Lead[])
        setLoading(false)
    }

    async function updateLeadStatus(leadId: string, newStatus: string) {
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

    function getWhatsAppLink(phone: string, businessName: string) {
        const clean = phone.replace(/\D/g, '')
        const number = clean.startsWith('55') ? clean : `55${clean}`
        const message = encodeURIComponent(
            `Olá! Encontrei a ${businessName} pelo Google Maps e gostaria de saber mais sobre os seus serviços.`
        )
        return `https://wa.me/${number}?text=${message}`
    }

    function formatPhone(phone: string) {
        if (!phone) return ''
        const clean = phone.replace(/\D/g, '')
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
        }
        return phone
    }

    if (loading) {
        return (
            <div className="card">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loading-spinner" style={{ borderColor: 'var(--color-primary)', borderRightColor: 'transparent', width: '2rem', height: '2rem', marginBottom: '1rem' }} />
                    <p>Carregando seus leads...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="page-header">
                <h1>👥 Meus Leads</h1>
                <p>Todos os leads coletados nas suas buscas.</p>
            </div>

            {!leads || leads.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>Nenhum lead coletado</h3>
                        <p>Faça uma busca para começar a coletar leads!</p>
                        <Link href="/search" className="btn btn-primary">
                            Fazer Busca
                        </Link>
                    </div>
                </div>
            ) : (
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
                                        <th style={{ width: '10%' }}>Cidade</th>
                                        <th style={{ width: '15%' }}>E-mail</th>
                                        <th style={{ width: '10%' }}>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id}>
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
                                            <td>
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
                                                <span style={{ fontSize: '0.85rem' }}>
                                                    {lead.city || '—'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
                                                {lead.email_1 || '—'}
                                            </td>
                                            <td data-label="Ação">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleOpenModal(lead)}
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

                    {/* Mobile: Photo cards */}
                    <div className="mobile-only lead-cards-grid">
                        {leads.map((lead) => (
                            <div
                                key={lead.id}
                                className="lead-photo-card"
                                onClick={() => handleOpenModal(lead)}
                            >
                                <div className="lead-photo-card-img">
                                    {lead.photo_url ? (
                                        <img src={lead.photo_url} alt={lead.name} loading="lazy" />
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
                                    <div className="lead-photo-card-location" style={{ marginTop: '0.25rem' }}>
                                        <small style={{ color: 'var(--color-text-tertiary)' }}>
                                            Busca: {lead.searches?.term} - {lead.searches?.city}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Detail Modal */}
            {selectedLead && (
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
                                const rua = parts[0]
                                const numero = parts[1] ? (parts[1].split('-')[0] || '').trim() : ''
                                const bairroComprovavel = parts[1] && parts[1].includes('-') ? parts[1].split('-')[1].trim() : (parts[2] || '')
                                const cidadeEstado = parts[3] ? parts[3].trim() : (parts[2] || '')
                                const cep = parts[4] ? parts[4].trim() : ''

                                return (
                                    <>
                                        <div className="lead-modal-row">
                                            <span className="lead-modal-label">🏠 Rua</span>
                                            <span className="lead-modal-value">{rua}{numero ? `, ${numero}` : ''}</span>
                                        </div>
                                        {bairroComprovavel && (
                                            <div className="lead-modal-row">
                                                <span className="lead-modal-label">🏘️ Bairro</span>
                                                <span className="lead-modal-value">{bairroComprovavel}</span>
                                            </div>
                                        )}
                                        {cidadeEstado && (
                                            <div className="lead-modal-row">
                                                <span className="lead-modal-label">🌆 Município</span>
                                                <span className="lead-modal-value">{cidadeEstado}</span>
                                            </div>
                                        )}
                                        {cep && cep.match(/\d{5}-\d{3}/) && (
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
            )}
        </>
    )
}
