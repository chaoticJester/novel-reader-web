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
            className="h-full antialiased`"
        >
            <body className={`min-h-full flex flex-col`}>{children}</body>
        </html>
    );
}
