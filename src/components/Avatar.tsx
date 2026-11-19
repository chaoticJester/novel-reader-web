const sizes = {
    sm: 'size-7 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-20 text-2xl',
} as const

export default function Avatar({
    name,
    url,
    size = 'md',
}: {
    name: string
    url: string | null
    size?: keyof typeof sizes
}) {
    // alt="" เพราะชื่ออยู่ข้างๆ เสมอ ถ้าใส่ชื่อซ้ำ โปรแกรมอ่านหน้าจอจะอ่านชื่อสองรอบ
    if (url) {
      return <img src={url} alt="" className={`${sizes[size]} shrink-0 rounded-full object-cover`} />
    }

    // ไม่มีรูป: ใช้ตัวอักษรแรกของชื่อ (Array.from นับอีโมจิเป็น 1 ตัวได้ถูกต้อง)
    const initial = Array.from(name)[0]?.toUpperCase() ?? '?'

    return (
        <span
            aria-hidden="true"
            className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-gray-700 font-bold text-white`}
        >
            {initial}
        </span>
    )
}