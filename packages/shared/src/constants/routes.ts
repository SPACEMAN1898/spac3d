export const API_BASE = '/api/v1'

export const API_ROUTES = {
  // Health
  HEALTH: `${API_BASE}/health`,

  // Auth
  AUTH_REGISTER: `${API_BASE}/auth/register`,
  AUTH_LOGIN: `${API_BASE}/auth/login`,
  AUTH_REFRESH: `${API_BASE}/auth/refresh`,
  AUTH_LOGOUT: `${API_BASE}/auth/logout`,

  // Users
  USER_ME: `${API_BASE}/users/me`,

  // Organizations
  ORGS: `${API_BASE}/orgs`,
  ORG_BY_ID: (orgId: string) => `${API_BASE}/orgs/${orgId}`,
  ORG_INVITE: (orgId: string) => `${API_BASE}/orgs/${orgId}/invite`,
  ORG_MEMBERS: (orgId: string) => `${API_BASE}/orgs/${orgId}/members`,
  ORG_CHANNELS: (orgId: string) => `${API_BASE}/orgs/${orgId}/channels`,
  ORG_DM: (orgId: string) => `${API_BASE}/orgs/${orgId}/dm`,

  // Channels
  CHANNEL_BY_ID: (channelId: string) => `${API_BASE}/channels/${channelId}`,
  CHANNEL_MEMBERS: (channelId: string) => `${API_BASE}/channels/${channelId}/members`,
  CHANNEL_MEMBER: (channelId: string, userId: string) =>
    `${API_BASE}/channels/${channelId}/members/${userId}`,
  CHANNEL_MESSAGES: (channelId: string) => `${API_BASE}/channels/${channelId}/messages`,
  CHANNEL_SEARCH: (channelId: string) => `${API_BASE}/channels/${channelId}/search`,
  CHANNEL_READ: (channelId: string) => `${API_BASE}/channels/${channelId}/read`,
  CHANNEL_UPLOAD: (channelId: string) => `${API_BASE}/channels/${channelId}/upload`,

  // Messages
  MESSAGE_BY_ID: (messageId: string) => `${API_BASE}/messages/${messageId}`,

  // Attachments
  ATTACHMENT_URL: (attachmentId: string) => `${API_BASE}/attachments/${attachmentId}/url`,
} as const
