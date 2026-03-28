export const SocketEvents = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',

  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  PRESENCE_UPDATE: 'presence:update',

  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  CHANNEL_UPDATE: 'channel:update',

  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',

  USER_STATUS: 'user:status',

  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
