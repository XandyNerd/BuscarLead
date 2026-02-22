import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'


export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="main-wrapper">
                    {children}
                </div>
            </main>
        </div>
    )
}
