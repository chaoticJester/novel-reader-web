'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { safeNextPath } from '@/lib/safe-next-path'

export type LoginState = {
    error?: string
    email?: string   
}

export async function login(
    _previousState: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const email = formData.get('email')
    const password = formData.get('password')

    if (typeof email !== 'string' || typeof password !== 'string') {
        return { error: 'ข้อมูลไม่ถูกต้อง' }
    }

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
        return { error: 'กรุณากรอกอีเมลและรหัสผ่าน', email: trimmedEmail }
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
    })

    if (error) {
        if (error.code === 'email_not_confirmed') {
            return {
                error: 'กรุณายืนยันอีเมลก่อน โดยกดลิงก์ในอีเมลที่เราส่งไป',
                email: trimmedEmail,
            }
        }

        return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', email: trimmedEmail }
    }

    redirect(safeNextPath(formData.get('next')))
}

export async function logout(): Promise<void> {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    redirect('/')
}