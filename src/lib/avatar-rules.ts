export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB

export const AVATAR_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

export const AVATAR_ACCEPT = Object.keys(AVATAR_EXTENSIONS).join(',')