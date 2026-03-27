import {
  API_ROUTES,
  type ApiResponse,
  type Channel,
  type Message,
  type Organization,
  type PaginatedResponse
} from '@clinikchat/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Navigate, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom'

import { Sidebar } from '../components/app/Sidebar'
import { api } from '../lib/api'

interface AppShellContext {
  organizations: Organization[]
  channels: Channel[]
  currentChannel: Channel | undefined
}

const fetchOrganizations = async () => {
  const response = await api.get<ApiResponse<Organization[]>>(API_ROUTES.orgs.base)
  return response.data.data ?? []
}

const fetchChannels = async (orgId: string) => {
  const response = await api.get<ApiResponse<Channel[]>>(API_ROUTES.orgs.channels(orgId))
  return response.data.data ?? []
}

export const AppShellPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { orgSlug, channelId } = useParams()

  const organizationsQuery = useQuery({ queryKey: ['orgs'], queryFn: fetchOrganizations })
  const currentOrg = organizationsQuery.data?.find((organization) => organization.slug === orgSlug) ?? organizationsQuery.data?.[0]
  const channelsQuery = useQuery({
    queryKey: ['channels', currentOrg?.id],
    queryFn: () => fetchChannels(currentOrg!.id),
    enabled: Boolean(currentOrg?.id)
  })

  const currentChannel = channelsQuery.data?.find((channel) => channel.id === channelId) ?? channelsQuery.data?.[0]

  const readMutation = useMutation({
    mutationFn: async (nextChannelId: string) => {
      await api.post(API_ROUTES.channels.read(nextChannelId), {})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['channels', currentOrg?.id] })
    }
  })

  useEffect(() => {
    if (!orgSlug && currentOrg && currentChannel) {
      void navigate(`/app/${currentOrg.slug}/${currentChannel.id}`, { replace: true })
      return
    }

    if (currentOrg && currentChannel && channelId !== currentChannel.id) {
      void navigate(`/app/${currentOrg.slug}/${currentChannel.id}`, { replace: true })
      return
    }

    if (channelId) {
      void readMutation.mutateAsync(channelId)
    }
  }, [channelId, currentChannel, currentOrg, navigate, orgSlug, readMutation])

  const contextValue = useMemo<AppShellContext>(
    () => ({
      organizations: organizationsQuery.data ?? [],
      channels: channelsQuery.data ?? [],
      currentChannel
    }),
    [channelsQuery.data, currentChannel, organizationsQuery.data]
  )

  if (organizationsQuery.isLoading || channelsQuery.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">Loading workspace...</div>
  }

  if (!currentOrg || !currentChannel) {
    return <Navigate to="/register" replace />
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar organizations={contextValue.organizations} channels={contextValue.channels} />
      <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <Outlet context={contextValue} />
      </main>
    </div>
  )
}

export const useAppShell = () => useOutletContext<AppShellContext>()

export const fetchMessages = async (channelId: string) => {
  const response = await api.get<ApiResponse<PaginatedResponse<Message>>>(API_ROUTES.channels.messages(channelId))
  return response.data.data?.items ?? []
}
