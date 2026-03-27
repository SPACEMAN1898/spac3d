import { create } from 'zustand'

interface UIState {
  activeOrgId: string | null
  activeChannelId: string | null
  setActiveOrg: (orgId: string | null) => void
  setActiveChannel: (channelId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeOrgId: null,
  activeChannelId: null,
  setActiveOrg: (orgId) => set({ activeOrgId: orgId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
}))
