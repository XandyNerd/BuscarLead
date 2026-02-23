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

        // Insert leads with deduplication
        let savedCount = 0
        if (leads && Array.isArray(leads) && leads.length > 0) {
            // 1. Deduplicate within this batch by phone number
            const seen = new Set<string>()
            const uniqueLeads = leads.filter((lead: Record<string, unknown>) => {
                const phone = String(lead.phone || lead.phoneNumber || '').trim()
                if (!phone || seen.has(phone)) return false
                seen.add(phone)
                return true
            })

            // 2. Check which phones already exist for this search
            const phones = uniqueLeads.map((l: Record<string, unknown>) =>
                String(l.phone || l.phoneNumber || '').trim()
            )
            const { data: existing } = await supabase
                .from('leads')
                .select('phone')
                .eq('search_id', search_id)
                .in('phone', phones)

            const existingPhones = new Set((existing || []).map((e: { phone: string }) => e.phone))

            // 3. Only insert truly new leads
            const newLeads = uniqueLeads
                .filter((lead: Record<string, unknown>) => {
                    const phone = String(lead.phone || lead.phoneNumber || '').trim()
                    return !existingPhones.has(phone)
                })
                .map((lead: Record<string, unknown>) => ({
                    search_id,
                    user_id: search.user_id,
                    name: String(lead.name || lead.title || '').split(/\s*[\|\-]\s*/)[0].trim(),
                    phone: String(lead.phone || lead.phoneNumber || '').trim(),
                    address: String(lead.address || ''),
                    neighborhood: String(lead.neighborhood || lead.bairro || ''),
                    city: String(lead.city || lead.cidade || ''),
                    rating: lead.rating || null,
                    website: lead.website || null,
                    email_1: lead.email_1 || lead.email || (Array.isArray(lead.emails) ? lead.emails[0] : null) || null,
                    email_2: lead.email_2 || (Array.isArray(lead.emails) ? lead.emails[1] : null) || null,
                    photo_url: lead.thumbnailUrl || lead.imageUrl || lead.photo_url || null,
                    photos: Array.isArray(lead.images) ? lead.images.map((img: any) => img.imageUrl || img.url || img) : [],
                    status: 'novo',
                }))

            if (newLeads.length > 0) {
                const { error: insertError } = await supabase
                    .from('leads')
                    .insert(newLeads)

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
                savedCount = newLeads.length
            }
        }

        // Count total unique leads for this search
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('search_id', search_id)

        // Update search status
        await supabase
            .from('searches')
            .update({
                status: 'concluido',
                leads_count: count || 0,
            })
            .eq('id', search_id)

        return NextResponse.json({
            success: true,
            message: `${savedCount} leads salvos com sucesso (${count} total).`,
        })
    } catch (err) {
        console.error('Webhook error:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
