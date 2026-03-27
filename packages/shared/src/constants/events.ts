export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SYNC: 'presence:sync',

  // Channels
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  CHANNEL_UPDATED: 'channel:updated',
  CHANNEL_MEMBER_ADDED: 'channel:member_added',
  CHANNEL_MEMBER_REMOVED: 'channel:member_removed',

  // Reactions
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',

  // Read receipts
  MESSAGES_READ: 'messages:read',
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
