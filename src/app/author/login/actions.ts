'use server'

import {redirect} from 'next/navigation'
import {
    createAuthorSession,
    deleteAuthorSession,
    isCorrectAuthorCode,
} from '@/lib/author-session'

export type LoginState = {
    error?: string
}

export async function login(
    _previousState: LoginState,
    fromData: FormData,
): Promise<LoginState> {
    const code = fromData.get('code')

    if(typeof code !== 'string' || !code) {
        return {error: 'กรุณากรอกรหัส'}
    }

    if(!isCorrectAuthorCode(code)) {
        return {error: 'รหัสไม่ถูกต้อง'}
    }

    await createAuthorSession()
    redirect('/author')
}

export async function logout(): Promise<void> {
    await deleteAuthorSession()
    redirect('/author/login')
}
