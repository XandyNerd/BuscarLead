import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'


export default async function LeadsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: leads } = await supabase
        .from('leads')
        .select('*, searches(term, city)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100)

    function getWhatsAppLink(phone: string, businessName: string) {
        const clean = phone.replace(/\D/g, '')
        const number = clean.startsWith('55') ? clean : `55${clean}`
        const message = encodeURIComponent(
            `Olá! Encontrei a ${businessName} pelo Google Maps e gostaria de saber mais sobre os seus serviços.`
        )
        return `https://wa.me/${number}?text=${message}`
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
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Nome</th>
                                <th style={{ width: '15%' }}>Telefone</th>
                                <th style={{ width: '10%' }}>Bairro</th>
                                <th style={{ width: '10%' }}>Cidade</th>
                                <th style={{ width: '10%' }}>Avaliação</th>
                                <th style={{ width: '15%' }}>E-mail</th>
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
                                            {lead.phone || '—'}
                                        </div>
                                    </td>
                                    <td data-label="Bairro">
                                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                            {lead.neighborhood || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Cidade">
                                        <span style={{ fontSize: '0.85rem' }}>
                                            {lead.city || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Avaliação">
                                        {lead.rating ? (
                                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                                ⭐ {lead.rating}
                                            </span>
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
            )}
        </>
    )
}
