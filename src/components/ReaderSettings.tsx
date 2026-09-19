'use client'

import { useState } from 'react'
import { useReaderSettings } from './ReaderSettingsProvider'

interface Font {
    key: string
    label: string
    className: string
}

const segButton = (active: boolean) =>
    `h-11 flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${
        active
            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
    }`

const stepButton =
    'w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors font-medium'

interface ReaderSettingsProps {
    fonts: Font[]
    triggerClassName?: string
    showLabel?: boolean
    isOpen?: boolean
    onOpenChange?: (isOpen: boolean) => void
    presentation?: 'modal' | 'top-panel'
}

export default function ReaderSettings({
    fonts,
    triggerClassName,
    showLabel = false,
    isOpen: controlledIsOpen,
    onOpenChange,
    presentation = 'modal',
}: ReaderSettingsProps) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false)
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen
    const setIsOpen = (next: boolean) => {
        if (controlledIsOpen === undefined) setUncontrolledIsOpen(next)
        onOpenChange?.(next)
    }
    const { fontKey, setFontKey, fontSize, setFontSize, increaseFont, decreaseFont, resetFont, theme, setTheme } =
        useReaderSettings()

    const SunIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    )
    const MoonIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    )

    return (
        <>
            {/* ปุ่มลอย เข้าถึงได้ทั้งบนมือถือ (นิ้วโป้ง) และเดสก์ท็อป */}
            <button
                onClick={() => setIsOpen(true)}
                aria-label="ตั้งค่าการอ่าน"
                className={triggerClassName ?? 'fixed bottom-5 right-5 z-30 w-14 h-14 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-colors'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {showLabel && <span className="ml-2 hidden md:inline">ตั้งค่า</span>}
            </button>

            {isOpen && (
                <div
                    className={presentation === 'top-panel'
                        ? 'pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-end p-2 sm:top-20 sm:px-4'
                        : 'fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4'}
                    onClick={presentation === 'modal' ? () => setIsOpen(false) : undefined}
                >
                    <div
                        className={presentation === 'top-panel'
                            ? 'pointer-events-auto flex max-h-[calc(100vh-5rem)] w-full flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900 sm:w-[26rem]'
                            : 'flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-md sm:rounded-2xl'}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg dark:text-white">ตั้งค่าการอ่าน</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="ปิด"
                                className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:text-red-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5 flex flex-col gap-6">
                            {/* ธีม */}
                            <section>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">ธีม</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setTheme('light')} className={segButton(theme === 'light')}>
                                        {SunIcon} สว่าง
                                    </button>
                                    <button onClick={() => setTheme('dark')} className={segButton(theme === 'dark')}>
                                        {MoonIcon} มืด
                                    </button>
                                </div>
                            </section>

                            {/* ขนาดอักษร */}
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">ขนาดอักษร</p>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{fontSize}px</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={decreaseFont} className={stepButton} aria-label="ลดขนาด">
                                        A-
                                    </button>
                                    <input
                                        type="range"
                                        min={12}
                                        max={32}
                                        step={1}
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        aria-label="ปรับขนาดอักษร"
                                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-blue-500"
                                    />
                                    <button onClick={increaseFont} className={`${stepButton} text-lg`} aria-label="เพิ่มขนาด">
                                        A+
                                    </button>
                                </div>
                                <button
                                    onClick={resetFont}
                                    className="mt-2 text-sm text-blue-500 dark:text-blue-400 hover:underline"
                                >
                                    รีเซ็ตขนาด
                                </button>
                            </section>

                            {/* แบบอักษร */}
                            <section>
                                <label htmlFor="reader-font-select" className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2 block">แบบอักษร</label>
                                <div className="relative">
                                    <select
                                        id="reader-font-select"
                                        value={fontKey}
                                        onChange={(e) => setFontKey(e.target.value)}
                                        className={`${fonts.find((f) => f.key === fontKey)?.className ?? ''} h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-base text-slate-800 transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100`}
                                    >
                                        {fonts.map((font) => (
                                            <option key={font.key} value={font.key} className={font.className}>
                                                {font.label} — ก ข ค AaBb
                                            </option>
                                        ))}
                                    </select>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
