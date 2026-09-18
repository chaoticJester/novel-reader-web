import 'server-only'

import {createHmac, createHash, timingSafeEqual} from 'node:crypto'
import {cookies} from 'next/headers'

const COOKIE_NAME = 'author_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 8

type SessionPayload = {
    exp: number
    codeVersion: string
}

function requireEnvironmentValue(name: string): string {
    const value = process.env[name]

    if(!value) {
        throw new Error(`${name} is not configured`)
    }

    return value
} 

function encode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url')
}

function decode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(value: string): string {
    const secret = requireEnvironmentValue("AUTHOR_SESSION_SECRET")

    return createHmac('sha256', secret)
        .update(value)
        .digest('base64url')
}

function getCodeVersion(): string {
    const code = requireEnvironmentValue('AUTHOR_ACCESS_CODE')

    return createHash('sha256')
        .update(code)
        .digest('base64url')
}

function safeEqual(first: string, second: string): boolean {
    const firstBuffer = Buffer.from(first)
    const secondBuffer = Buffer.from(second)

    if (firstBuffer.length !== secondBuffer.length) {
        return false
    }

    return timingSafeEqual(firstBuffer, secondBuffer)
}

export function isCorrectAuthorCode(candidate: string): boolean {
    const expected = requireEnvironmentValue('AUTHOR_ACCESS_CODE')

    return safeEqual(candidate, expected)
}

function createSessionToken(): string {
    const payload: SessionPayload = {
        exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
        codeVersion: getCodeVersion(),
    }
    const encodedPayload = encode(JSON.stringify(payload))
    const signature = sign(encodedPayload)

    return `${encodedPayload}.${signature}`
}

export function verifySessionToken(
    token: string | undefined,
): boolean {
    if(!token) {
        return false
    }

    const [encodedPayload, suppliedSignature] = token.split('.')

    if(!encodedPayload || !suppliedSignature) {
        return false
    }

    const expectedSignature = sign(encodedPayload)

    if(!safeEqual(suppliedSignature, expectedSignature)) {
        return false
    }

    try {
        const payload = JSON.parse(
            decode(encodedPayload),
        ) as SessionPayload

        const now = Math.floor(Date.now() / 1000)

        return (
            payload.exp > now && payload.codeVersion === getCodeVersion()
        )
    } catch {
        return false
    }
}

export async function createAuthorSession(): Promise<void> {
    const cookieStore = await cookies()

    cookieStore.set(COOKIE_NAME, createSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/author',
        maxAge: SESSION_DURATION_SECONDS,
    })
}

export async function deleteAuthorSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}

export async function hasAuthorSession(): Promise<boolean> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    return verifySessionToken(token)
}

export async function requireAuthorSession(): Promise<void> {
    if (!(await hasAuthorSession())) {
        throw new Error('Unauthorized')
    }
}

export const authorSessionCookieName = COOKIE_NAME