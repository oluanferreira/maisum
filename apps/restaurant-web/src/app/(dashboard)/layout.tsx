import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="restaurant-theme min-h-screen bg-[#100d06] text-[#f4ede4]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-[#292218] bg-[#100d06]">
        <Sidebar />
        <main className="min-h-[calc(100vh-72px)] flex-1 px-4 pb-28 pt-6 sm:px-5">
          {children}
        </main>
      </div>
    </div>
  )
}
