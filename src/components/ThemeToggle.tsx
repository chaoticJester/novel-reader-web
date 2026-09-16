'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    // ซิงค์สถานะเริ่มต้นจาก class ที่ inline script ตั้งไว้ (กันจอกระพริบ)
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'))
        setMounted(true)
    }, [])

    const toggle = () => {
        const next = !isDark
        setIsDark(next)
        const root = document.documentElement
        root.classList.toggle('dark', next)
        try {
            localStorage.setItem('theme', next ? 'dark' : 'light')
        } catch {}
    }

    return (
        <button
            onClick={toggle}
            aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all"
        >
            {/* กันการ mismatch ระหว่าง SSR/CSR: แสดงไอคอนหลัง mount */}
            {mounted && (isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            ))}
        </button>
    )
}
