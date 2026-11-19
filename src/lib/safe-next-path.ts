export function safeNextPath(value: unknown): string {
    if (typeof value !== 'string') return '/'
    if (!value.startsWith('/')) return '/'
    if (value.startsWith('//') || value.startsWith('/\\')) return '/'
    return value
}
