import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
    title: "Rat Novel",
    description: "เว็บอ่านนิยายออนไลน์โดยหนูท่อ มุฮ่ะฮ่ะฮ่ะฮา",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className="h-full antialiased"
            suppressHydrationWarning
        >
            <head>
                {/* ตั้ง class 'dark' ก่อน paint เพื่อกันจอกระพริบ (ใช้ค่าที่ผู้ใช้เลือก ถ้าไม่มีก็ตามระบบ) */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
                    }}
                />
            </head>
            <body className={`min-h-full flex flex-col`}>{children}</body>
        </html>
    );
}
