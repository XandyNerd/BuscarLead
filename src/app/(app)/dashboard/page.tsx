import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { count: totalSearches } = await supabase
        .from('searches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

    const { data: recentSearches } = await supabase
        .from('searches')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const userName = user?.user_metadata?.name || 'usuário'

    return (
        <>
            <div className="page-header">
                <h1>Olá, {userName}! 👋</h1>
                <p>Aqui está o resumo das suas buscas e leads.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Buscas Realizadas</div>
                    <div className="stat-value">{totalSearches || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Leads Coletados</div>
                    <div className="stat-value">{totalLeads || 0}</div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Buscas Recentes</h2>
                    <Link href="/search" className="btn btn-primary btn-sm">
                        + Nova Busca
                    </Link>
                </div>

                {!recentSearches || recentSearches.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>Nenhuma busca ainda</h3>
                        <p>Comece buscando leads na sua região!</p>
                        <Link href="/search" className="btn btn-primary">
                            Fazer Primeira Busca
                        </Link>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Termo</th>
                                    <th>Cidade</th>
                                    <th>Status</th>
                                    <th>Leads</th>
                                    <th>Data</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSearches.map((search) => (
                                    <tr key={search.id}>
                                        <td><strong>{search.term}</strong></td>
                                        <td>{search.city}</td>
                                        <td>
                                            <span className={`badge badge-${search.status}`}>
                                                {search.status}
                                            </span>
                                        </td>
                                        <td>{search.leads_count || 0}</td>
                                        <td>{new Date(search.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <Link href={`/search/${search.id}`} className="btn btn-secondary btn-sm">
                                                Ver leads
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}
