import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { search_id } = await request.json()

        if (!search_id) {
            return NextResponse.json(
                { error: 'ID da busca é obrigatório.' },
                { status: 400 }
            )
        }

        // Fetch search record
        const { data: search, error: fetchError } = await supabase
            .from('searches')
            .select('*')
            .eq('id', search_id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !search) {
            return NextResponse.json(
                { error: 'Busca não encontrada.' },
                { status: 404 }
            )
        }

        // Delete existing leads
        await supabase
            .from('leads')
            .delete()
            .eq('search_id', search_id)

        // Reset search status
        await supabase
            .from('searches')
            .update({ status: 'processando', leads_count: 0 })
            .eq('id', search_id)

        // Trigger n8n webhook
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
        if (n8nWebhookUrl) {
            try {
                await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        search_id: search.id,
                        term: search.term,
                        city: search.city,
                        callback_url: `${getBaseUrl(request)}/api/webhooks/n8n-results`,
                    }),
                })
            } catch (webhookError) {
                console.error('Erro ao chamar n8n:', webhookError)
                await supabase
                    .from('searches')
                    .update({ status: 'erro' })
                    .eq('id', search.id)

                return NextResponse.json(
                    { error: 'Erro ao reiniciar busca no n8n.' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true, id: search.id })
    } catch {
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}

function getBaseUrl(request: Request): string {
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    return `${protocol}://${host}`
}
