import { API_ROUTES } from '@clinikchat/shared'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'

import { api } from '../lib/api'

interface Organization {
  id: string
  slug: string
}

interface Channel {
  id: string
}

export function AppHomePage() {
  const orgsQuery = useQuery({
    queryKey: ['orgs', 'home'],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.orgs.base)
      return (response.data.data ?? []) as Organization[]
    }
  })

  const firstOrg = orgsQuery.data?.[0]

  const channelsQuery = useQuery({
    queryKey: ['home-channels', firstOrg?.id],
    enabled: Boolean(firstOrg?.id),
    queryFn: async () => {
      const response = await api.get(`${API_ROUTES.orgs.base}/${firstOrg!.id}/channels`)
      return (response.data.data ?? []) as Channel[]
    }
  })

  const firstChannel = channelsQuery.data?.[0]

  if (firstOrg && firstChannel) {
    return <Navigate to={`/app/${firstOrg.slug}/${firstChannel.id}`} replace />
  }

  return <div className="grid h-full place-content-center text-sm text-gray-500">No channels yet.</div>
}
