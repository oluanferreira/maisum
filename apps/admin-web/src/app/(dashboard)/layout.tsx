import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col" style={{ backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <header
          className="flex items-center px-8"
          style={{
            height: 64,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <h2 className="text-lg font-semibold text-neutral-800">+um Admin</h2>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
