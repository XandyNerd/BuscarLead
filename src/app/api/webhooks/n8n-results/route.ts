import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // Create Supabase client with SERVICE_ROLE_KEY to bypass RLS for server-to-server webhook
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // Verify webhook secret
        const webhookSecret = request.headers.get('x-webhook-secret')
        if (webhookSecret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { search_id, leads } = body

        if (!search_id) {
            return NextResponse.json(
                { error: 'search_id é obrigatório.' },
                { status: 400 }
            )
        }

        // Get the search to find user_id
        const { data: search, error: searchError } = await supabase
            .from('searches')
            .select('user_id')
            .eq('id', search_id)
            .single()

        if (searchError || !search) {
            return NextResponse.json(
                { error: 'Busca não encontrada.' },
                { status: 404 }
            )
        }

        // Insert leads
        if (leads && Array.isArray(leads) && leads.length > 0) {
            const leadsToInsert = leads.map((lead: Record<string, unknown>) => ({
                search_id,
                user_id: search.user_id,
                name: lead.name || lead.title || '',
                phone: lead.phone || lead.phoneNumber || '',
                address: lead.address || '',
                neighborhood: lead.neighborhood || lead.bairro || '',
                city: lead.city || lead.cidade || '',
                rating: lead.rating || null,
                website: lead.website || null,
                email_1: lead.email_1 || lead.email || null,
                email_2: lead.email_2 || null,
                status: 'novo',
            }))

            const { error: insertError } = await supabase
                .from('leads')
                .insert(leadsToInsert)

            if (insertError) {
                console.error('Erro ao inserir leads:', insertError)
                await supabase
                    .from('searches')
                    .update({ status: 'erro' })
                    .eq('id', search_id)

                return NextResponse.json(
                    { error: 'Erro ao salvar leads.' },
                    { status: 500 }
                )
            }
        }

        // Update search status
        await supabase
            .from('searches')
            .update({
                status: 'concluido',
                leads_count: leads?.length || 0,
            })
            .eq('id', search_id)

        return NextResponse.json({
            success: true,
            message: `${leads?.length || 0} leads salvos com sucesso.`,
        })
    } catch (err) {
        console.error('Webhook error:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
