import Navbar, { type NavigationItem } from '@/components/Navbar'

const menuItems: NavigationItem[] = [
    { href: '/', label: 'หน้าหลัก' },
]

export default function AuthorLayout({ children }: LayoutProps<'/author'>) {
    return (
        <>
            <Navbar items={menuItems} />
            {children}
        </>
    )
}