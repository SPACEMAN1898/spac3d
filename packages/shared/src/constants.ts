export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  AUTH: "auth",
  JOIN_CHANNEL: "channel:join",
  LEAVE_CHANNEL: "channel:leave",
  JOIN_ORG: "org:join",
  LEAVE_ORG: "org:leave",
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  PRESENCE_UPDATE: "presence:update",
  READ_RECEIPT: "read:receipt",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const API_ROUTES = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  USERS: {
    ME: "/api/users/me",
  },
  ORGS: {
    BASE: "/api/organizations",
    BY_ID: (id: string) => `/api/organizations/${id}`,
    MEMBERS: (id: string) => `/api/organizations/${id}/members`,
    INVITE: (id: string) => `/api/organizations/${id}/invite`,
  },
  CHANNELS: {
    BASE: (orgId: string) => `/api/organizations/${orgId}/channels`,
    BY_ID: (orgId: string, channelId: string) =>
      `/api/organizations/${orgId}/channels/${channelId}`,
    MEMBERS: (orgId: string, channelId: string) =>
      `/api/organizations/${orgId}/channels/${channelId}/members`,
    DM: (orgId: string) => `/api/organizations/${orgId}/channels/dm`,
  },
  MESSAGES: {
    LIST: (orgId: string, channelId: string) =>
      `/api/organizations/${orgId}/channels/${channelId}/messages`,
    BY_ID: (orgId: string, channelId: string, messageId: string) =>
      `/api/organizations/${orgId}/channels/${channelId}/messages/${messageId}`,
    READ: (orgId: string, channelId: string) =>
      `/api/organizations/${orgId}/channels/${channelId}/messages/read`,
  },
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
