import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/api'
import type { Organization, ApiResponse } from '@clinikchat/shared'

export function useOrgs() {
  return useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Organization[]>>('/orgs')
      return res.data.data
    },
  })
}
