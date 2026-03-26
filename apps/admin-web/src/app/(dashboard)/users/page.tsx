'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/../lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  role: string
  created_at: string
}

const roleBadge: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  restaurant_admin: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
}

const roleLabel: Record<string, string> = {
  user: 'Usuario',
  restaurant_admin: 'Admin Rest.',
  super_admin: 'Super Admin',
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
  }, [roleFilter])

  async function loadProfiles() {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar usuarios:', error)
    } else {
      setProfiles(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Usuarios</h1>
          <p className="text-neutral-600">Gerenciar usuarios e assinantes</p>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Todos os roles</option>
          <option value="user">Usuario</option>
          <option value="restaurant_admin">Admin Restaurante</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-500">Carregando usuarios...</div>
      ) : profiles.length === 0 ? (
        <div className="py-12 text-center text-neutral-500">Nenhum usuario encontrado</div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-neutral-500">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {profile.full_name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[profile.role] || 'bg-neutral-100 text-neutral-700'}`}
                    >
                      {roleLabel[profile.role] || profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
