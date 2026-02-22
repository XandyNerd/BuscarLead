import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { lead_id, status } = body

        if (!lead_id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate status
        const validStatuses = ['novo', 'contatado', 'sem_interesse']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Update the lead status
        const { error } = await supabase
            .from('leads')
            .update({ status })
            .eq('id', lead_id)
            .eq('user_id', user.id) // Security check to ensure user owns the lead

        if (error) {
            console.error('Failed to update lead status:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({ success: true, status })
    } catch (error) {
        console.error('API Error /api/leads/status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
