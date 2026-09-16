'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ReaderSettings {
    fontKey: string
    fontSize: number
    theme: Theme
    setFontKey: (key: string) => void
    setFontSize: (size: number) => void
    increaseFont: () => void
    decreaseFont: () => void
    resetFont: () => void
    setTheme: (theme: Theme) => void
}

const DEFAULT_FONT = 'noto-serif'
const DEFAULT_SIZE = 20
const MIN_SIZE = 12
const MAX_SIZE = 32

const clamp = (n: number) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, n))

const ReaderSettingsContext = createContext<ReaderSettings | null>(null)

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
    const [fontKey, setFontKeyState] = useState(DEFAULT_FONT)
    const [fontSize, setFontSizeState] = useState(DEFAULT_SIZE)
    const [theme, setThemeState] = useState<Theme>('light')

    // ดึงค่าที่บันทึกไว้ (ต่ออุปกรณ์) หลัง mount เพื่อกัน hydration mismatch
    useEffect(() => {
        try {
            const fk = localStorage.getItem('reader-font')
            if (fk) setFontKeyState(fk)
            const fs = localStorage.getItem('reader-font-size')
            if (fs) setFontSizeState(clamp(Number(fs)))
        } catch {}
        // ธีมใช้ค่าเดียวกับปุ่มสลับธีมหน้าอื่น (class 'dark' บน <html> + key 'theme')
        setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }, [])

    const setFontKey = (key: string) => {
        setFontKeyState(key)
        try {
            localStorage.setItem('reader-font', key)
        } catch {}
    }

    const setFontSize = (size: number) => {
        const next = clamp(size)
        setFontSizeState(next)
        try {
            localStorage.setItem('reader-font-size', String(next))
        } catch {}
    }

    const increaseFont = () => setFontSize(fontSize + 1)
    const decreaseFont = () => setFontSize(fontSize - 1)
    const resetFont = () => setFontSize(DEFAULT_SIZE)

    const setTheme = (next: Theme) => {
        setThemeState(next)
        document.documentElement.classList.toggle('dark', next === 'dark')
        try {
            localStorage.setItem('theme', next)
        } catch {}
    }

    return (
        <ReaderSettingsContext.Provider
            value={{ fontKey, fontSize, theme, setFontKey, setFontSize, increaseFont, decreaseFont, resetFont, setTheme }}
        >
            {children}
        </ReaderSettingsContext.Provider>
    )
}

export function useReaderSettings() {
    const ctx = useContext(ReaderSettingsContext)
    if (!ctx) throw new Error('useReaderSettings must be used within a ReaderSettingsProvider')
    return ctx
}
