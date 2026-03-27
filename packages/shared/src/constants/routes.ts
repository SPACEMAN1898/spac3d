const BASE = '/api/v1';

export const ApiRoutes = {
  HEALTH: `${BASE}/health`,

  AUTH_REGISTER: `${BASE}/auth/register`,
  AUTH_LOGIN: `${BASE}/auth/login`,
  AUTH_REFRESH: `${BASE}/auth/refresh`,
  AUTH_LOGOUT: `${BASE}/auth/logout`,

  USER_ME: `${BASE}/users/me`,
  USER_AVATAR: `${BASE}/users/me/avatar`,
  USER_PASSWORD: `${BASE}/users/me/password`,

  ORGS: `${BASE}/orgs`,
  ORG_BY_ID: (orgId: string) => `${BASE}/orgs/${orgId}`,
  ORG_INVITE: (orgId: string) => `${BASE}/orgs/${orgId}/invite`,
  ORG_MEMBERS: (orgId: string) => `${BASE}/orgs/${orgId}/members`,

  ORG_CHANNELS: (orgId: string) => `${BASE}/orgs/${orgId}/channels`,
  ORG_DM: (orgId: string) => `${BASE}/orgs/${orgId}/dm`,
  CHANNEL_BY_ID: (channelId: string) => `${BASE}/channels/${channelId}`,
  CHANNEL_MEMBERS: (channelId: string) => `${BASE}/channels/${channelId}/members`,
  CHANNEL_MEMBER: (channelId: string, userId: string) =>
    `${BASE}/channels/${channelId}/members/${userId}`,

  CHANNEL_MESSAGES: (channelId: string) => `${BASE}/channels/${channelId}/messages`,
  MESSAGE_BY_ID: (messageId: string) => `${BASE}/messages/${messageId}`,
  CHANNEL_READ: (channelId: string) => `${BASE}/channels/${channelId}/read`,

  CHANNEL_UPLOAD: (channelId: string) => `${BASE}/channels/${channelId}/upload`,
  ATTACHMENT_URL: (attachmentId: string) => `${BASE}/attachments/${attachmentId}/url`,

  CHANNEL_SEARCH: (channelId: string) => `${BASE}/channels/${channelId}/search`,
} as const;
