// Types
export type { User, UserProfile, UserStatus, UpdateProfileRequest } from './types/user'
export type {
  Channel,
  ChannelWithMembers,
  ChannelMember,
  ChannelType,
  ChannelMemberRole,
  CreateChannelRequest,
  UpdateChannelRequest,
  CreateDmRequest,
} from './types/channel'
export type {
  Message,
  MessageType,
  Attachment,
  SendMessageRequest,
  EditMessageRequest,
  MessageCursor,
} from './types/message'
export type {
  LoginRequest,
  RegisterRequest,
  TokenPayload,
  AuthResponse,
  RefreshResponse,
} from './types/auth'
export type { ApiResponse, ApiError, PaginatedResponse, ApiResult } from './types/api'
export type {
  Organization,
  OrganizationMember,
  OrgMemberRole,
  CreateOrgRequest,
  UpdateOrgRequest,
  InviteToOrgRequest,
} from './types/org'

// Validation schemas
export {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from './validation/auth.schema'
export type { LoginInput, RegisterInput, UpdateProfileInput } from './validation/auth.schema'

export {
  createChannelSchema,
  updateChannelSchema,
  addChannelMemberSchema,
  createDmSchema,
  createOrgSchema,
  updateOrgSchema,
  inviteToOrgSchema,
} from './validation/channel.schema'
export type {
  CreateChannelInput,
  UpdateChannelInput,
  AddChannelMemberInput,
  CreateDmInput,
  CreateOrgInput,
  UpdateOrgInput,
  InviteToOrgInput,
} from './validation/channel.schema'

export {
  sendMessageSchema,
  editMessageSchema,
  messageCursorSchema,
} from './validation/message.schema'
export type {
  SendMessageInput,
  EditMessageInput,
  MessageCursorInput,
} from './validation/message.schema'

// Constants
export { SOCKET_EVENTS } from './constants/events'
export type { SocketEvent } from './constants/events'
export { API_BASE, API_ROUTES } from './constants/routes'
export { ERROR_CODES } from './constants/errors'
export type { ErrorCode } from './constants/errors'

// Utils
export { formatDate, formatTime, formatRelativeTime, formatFileSize, truncateText, isSameDay } from './utils/format'
