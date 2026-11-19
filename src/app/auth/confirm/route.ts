import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    const tokenHash = request.nextUrl.searchParams.get('token_hash')
    const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null

    if (tokenHash && type) {
        const supabase = await createSupabaseServerClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
        })

        if (!error) {
            redirect('/')
        }
    }

    redirect('/auth/confirm-error')
}