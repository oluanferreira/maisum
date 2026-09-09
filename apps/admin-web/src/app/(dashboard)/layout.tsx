import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell min-h-screen">
      <Sidebar />
      <div className="min-w-0 lg:pl-72">
        <main className="admin-safe-bottom mx-auto w-full max-w-[1600px] px-4 pt-20 sm:px-5 lg:px-8 lg:pt-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
