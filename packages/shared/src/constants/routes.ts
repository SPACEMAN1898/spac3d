export const API_BASE_PATH = '/api/v1'

export const API_ROUTES = {
  health: `${API_BASE_PATH}/health`,
  auth: {
    register: `${API_BASE_PATH}/auth/register`,
    login: `${API_BASE_PATH}/auth/login`,
    refresh: `${API_BASE_PATH}/auth/refresh`,
    logout: `${API_BASE_PATH}/auth/logout`
  },
  users: {
    me: `${API_BASE_PATH}/users/me`
  },
  orgs: {
    base: `${API_BASE_PATH}/orgs`,
    byId: (orgId: string) => `${API_BASE_PATH}/orgs/${orgId}`,
    invite: (orgId: string) => `${API_BASE_PATH}/orgs/${orgId}/invite`,
    members: (orgId: string) => `${API_BASE_PATH}/orgs/${orgId}/members`,
    channels: (orgId: string) => `${API_BASE_PATH}/orgs/${orgId}/channels`,
    dm: (orgId: string) => `${API_BASE_PATH}/orgs/${orgId}/dm`
  },
  channels: {
    byId: (channelId: string) => `${API_BASE_PATH}/channels/${channelId}`,
    members: (channelId: string) => `${API_BASE_PATH}/channels/${channelId}/members`,
    memberByUser: (channelId: string, userId: string) => `${API_BASE_PATH}/channels/${channelId}/members/${userId}`,
    messages: (channelId: string) => `${API_BASE_PATH}/channels/${channelId}/messages`,
    read: (channelId: string) => `${API_BASE_PATH}/channels/${channelId}/read`
  },
  messages: {
    byId: (messageId: string) => `${API_BASE_PATH}/messages/${messageId}`
  }
} as const
