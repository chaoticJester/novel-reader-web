export const MAX_DISPLAY_NAME_LENGTH = 50

const RESERVED_NAMES = [
    'admin',
    'administrator',
    'moderator',
    'แอดมิน',
    'ผู้ดูแล',
    'ผู้ดูแลระบบ',
    'rat novel',
    'ratnovel',
]

export function validateDisplayName(displayName: string): string | null {
    if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
        return `ชื่อที่แสดงต้องยาว 1–${MAX_DISPLAY_NAME_LENGTH} ตัวอักษร`
    }
    if (RESERVED_NAMES.includes(displayName.toLowerCase())) {
        return 'ไม่สามารถใช้ชื่อนี้ได้'
    }
    return null
}