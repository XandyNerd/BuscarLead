import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/admin/cleanup - Remove duplicate leads and update counts
export async function POST(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // Verify webhook secret for security
        const webhookSecret = request.headers.get('x-webhook-secret')
        if (webhookSecret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Find all duplicate leads (same search_id + phone, keep the first one)
        const { data: allLeads, error: fetchError } = await supabase
            .from('leads')
            .select('id, search_id, phone, created_at')
            .order('created_at', { ascending: true })

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        // Group by search_id + phone, mark duplicates for deletion
        const seen = new Map<string, string>() // key -> first id
        const duplicateIds: string[] = []

        for (const lead of allLeads || []) {
            const key = `${lead.search_id}::${lead.phone}`
            if (seen.has(key)) {
                duplicateIds.push(lead.id)
            } else {
                seen.set(key, lead.id)
            }
        }

        // 2. Delete duplicates in batches of 100
        let deleted = 0
        for (let i = 0; i < duplicateIds.length; i += 100) {
            const batch = duplicateIds.slice(i, i + 100)
            const { error: deleteError } = await supabase
                .from('leads')
                .delete()
                .in('id', batch)

            if (deleteError) {
                console.error('Erro ao deletar batch:', deleteError)
            } else {
                deleted += batch.length
            }
        }

        // 3. Update lead counts for all searches
        const { data: searches } = await supabase
            .from('searches')
            .select('id')

        for (const search of searches || []) {
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('search_id', search.id)

            await supabase
                .from('searches')
                .update({ leads_count: count || 0 })
                .eq('id', search.id)
        }

        return NextResponse.json({
            success: true,
            duplicates_removed: deleted,
            unique_leads_remaining: (allLeads?.length || 0) - deleted,
        })
    } catch (err) {
        console.error('Cleanup error:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
