import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090f] overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
