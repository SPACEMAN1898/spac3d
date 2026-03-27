import { Outlet } from 'react-router-dom'

import { useAuthStore } from '../store/auth.store'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex h-screen bg-contentBg">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <h1 className="text-sm font-semibold text-gray-900">ClinikChat</h1>
          <div className="text-right text-xs text-gray-500">
            <p>{user?.displayName ?? 'Guest'}</p>
            <p className="capitalize">{user?.status ?? 'offline'}</p>
          </div>
        </header>
        <section className="min-h-0 flex-1">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
