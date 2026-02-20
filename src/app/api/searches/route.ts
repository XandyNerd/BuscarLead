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

        const { term, city } = await request.json()

        if (!term || !city) {
            return NextResponse.json(
                { error: 'Termo de busca e cidade são obrigatórios.' },
                { status: 400 }
            )
        }

        // Create search record
        const { data: search, error: insertError } = await supabase
            .from('searches')
            .insert({
                user_id: user.id,
                term: term.trim(),
                city: city.trim(),
                status: 'processando',
                leads_count: 0,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Erro ao criar busca:', insertError)
            return NextResponse.json(
                { error: 'Erro ao criar busca.' },
                { status: 500 }
            )
        }

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
                // Update search status to error
                await supabase
                    .from('searches')
                    .update({ status: 'erro' })
                    .eq('id', search.id)

                return NextResponse.json(
                    { error: 'Erro ao iniciar busca no n8n.' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ id: search.id, status: search.status })
    } catch {
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}

function getBaseUrl(request: Request): string {
    const url = new URL(request.url)
    const host = url.host
    // Se estiver em localhost, troca para host.docker.internal para o n8n (no Docker) conseguir falar com o site
    if (host.includes('localhost')) {
        return `${url.protocol}//host.docker.internal:${url.port || '3000'}`
    }
    return `${url.protocol}//${host}`
}
