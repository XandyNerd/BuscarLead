import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/admin/reset - Delete ALL leads and searches for a fresh start
export async function POST(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const webhookSecret = request.headers.get('x-webhook-secret')
        if (webhookSecret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Delete ALL leads
        const { count: leadsDeleted } = await supabase
            .from('leads')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000')

        // 2. Delete ALL searches
        const { count: searchesDeleted } = await supabase
            .from('searches')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000')

        return NextResponse.json({
            success: true,
            leads_deleted: leadsDeleted || 0,
            searches_deleted: searchesDeleted || 0,
            message: 'Banco de dados zerado com sucesso!',
        })
    } catch (err) {
        console.error('Reset error:', err)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
