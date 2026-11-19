export const MAX_COMMENT_LENGTH = 2000


export function commentLength(text: string): number {
    return Array.from(text).length
}