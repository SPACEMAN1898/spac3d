import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/api'
import type { Channel, ApiResponse } from '@clinikchat/shared'

export function useChannels(orgId: string | null) {
  return useQuery({
    queryKey: ['channels', orgId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Channel[]>>(`/orgs/${orgId}/channels`)
      return res.data.data
    },
    enabled: !!orgId,
  })
}
