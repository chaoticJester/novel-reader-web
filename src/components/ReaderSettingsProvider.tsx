'use client'

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'

type Theme = 'light' | 'sepia' | 'eye-care' | 'dark'

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

const readerSettingKeys = new Set(['reader-font', 'reader-font-size', 'reader-theme'])
const readerSettingSubscribers = new Set<() => void>()
const memoryFallback = new Map<string, string>()

const subscribeToReaderSettings = (callback: () => void) => {
    readerSettingSubscribers.add(callback)

    const handleStorage = (event: StorageEvent) => {
        if (event.key && readerSettingKeys.has(event.key)) callback()
    }
    window.addEventListener('storage', handleStorage)

    return () => {
        readerSettingSubscribers.delete(callback)
        window.removeEventListener('storage', handleStorage)
    }
}

const readSetting = (key: string) => {
    try {
        return localStorage.getItem(key)
    } catch {
        return memoryFallback.get(key) ?? null
    }
}

const writeSetting = (key: string, value: string) => {
    memoryFallback.set(key, value)
    try {
        localStorage.setItem(key, value)
    } catch {}
    readerSettingSubscribers.forEach((callback) => callback())
}

const getFontSnapshot = () => readSetting('reader-font') || DEFAULT_FONT
const getFontSizeSnapshot = () => {
    const storedSize = Number(readSetting('reader-font-size'))
    return Number.isFinite(storedSize) && storedSize > 0 ? clamp(storedSize) : DEFAULT_SIZE
}
const getThemeSnapshot = (): Theme => {
    const savedTheme = readSetting('reader-theme')
    if (savedTheme === 'light' || savedTheme === 'sepia' || savedTheme === 'eye-care') return savedTheme
    return 'dark'
}
const getDefaultThemeSnapshot = (): Theme => 'dark'

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
    const fontKey = useSyncExternalStore(subscribeToReaderSettings, getFontSnapshot, () => DEFAULT_FONT)
    const fontSize = useSyncExternalStore(subscribeToReaderSettings, getFontSizeSnapshot, () => DEFAULT_SIZE)
    const theme = useSyncExternalStore(subscribeToReaderSettings, getThemeSnapshot, getDefaultThemeSnapshot)

    const setFontKey = (key: string) => {
        writeSetting('reader-font', key)
    }

    const setFontSize = (size: number) => {
        const next = clamp(size)
        writeSetting('reader-font-size', String(next))
    }

    const increaseFont = () => setFontSize(fontSize + 1)
    const decreaseFont = () => setFontSize(fontSize - 1)
    const resetFont = () => setFontSize(DEFAULT_SIZE)

    const setTheme = (next: Theme) => {
        writeSetting('reader-theme', next)
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
