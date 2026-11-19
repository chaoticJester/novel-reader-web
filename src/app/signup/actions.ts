'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { escapeLike } from '@/lib/escape-like'
import { validateDisplayName } from '@/lib/display-name'

export type SignupState = {
    error?: string
    done?: boolean
    values?: { displayName: string; email: string }  // เติมฟอร์มกลับ (ห้ามส่งรหัสผ่านกลับ)
}

const MIN_PASSWORD_LENGTH = 8

export async function signup(
    _previousState: SignupState,
    formData: FormData,
): Promise<SignupState> {
    const displayName = String(formData.get('displayName') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')
    const values = { displayName, email }

    // ---------- 1. ตรวจข้อมูล ----------
    const displayNameError = validateDisplayName(displayName)
     if (displayNameError) {
         return { error: displayNameError, values }
     }
     if (!email) {
        return { error: 'กรุณากรอกอีเมล', values }
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return { error: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`, values }
    }
    if (password !== confirmPassword) {
        return { error: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน', values }
    }

    const supabase = await createSupabaseServerClient()

    // ---------- 2. เช็กชื่อซ้ำก่อน ----------
    const { data: taken, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('display_name', escapeLike(displayName))
        .limit(1)

    if (lookupError) {
        return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่', values }
    }
    if (taken.length > 0) {
        return { error: 'ชื่อนี้ถูกใช้แล้ว ลองชื่ออื่นดูนะ', values }
    }

    // ---------- 3. สมัคร ----------
    const origin = (await headers()).get('origin') ?? 'http://localhost:3000'

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { display_name: displayName },
            emailRedirectTo: origin,
        },
    })

    if (error) {
        switch (error.code) {
            case 'user_already_exists': // ตอนปิด Confirm email
                return { error: 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน', values }
            case 'weak_password':
                return { error: 'รหัสผ่านง่ายเกินไป ลองตั้งให้ยากขึ้น', values }
            case 'email_address_invalid':
                return { error: 'รูปแบบอีเมลไม่ถูกต้อง', values }
            case 'over_email_send_rate_limit':
                return { error: 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', values }
            default:
                return { error: 'สมัครไม่สำเร็จ กรุณาลองใหม่', values }
        }
    }

    // ตอนเปิด Confirm email: อีเมลที่ยืนยันแล้วจะได้ user ปลอมที่ identities ว่าง
    // (ตั้งใจบอกผู้ใช้ว่าอีเมลนี้มีบัญชีแล้ว แลกกับการเปิดเผยว่าอีเมลนี้เป็นสมาชิก)
    if (data.user?.identities?.length === 0) {
        return { error: 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน', values }
    }

    // ถ้าปิด Confirm email ไว้ จะได้ session ทันที ล็อกอินเลย
    if (data.session) {
        redirect('/')
    }

    return { done: true }
}