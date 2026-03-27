export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: "online" | "away" | "offline";
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export type OrgRole = "owner" | "admin" | "member";

export interface OrganizationMember {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  role: OrgRole;
  joinedAt: string;
  user?: User;
}

export type ChannelType = "public" | "private" | "dm";

export interface Channel {
  id: UUID;
  organizationId: UUID;
  name: string;
  slug: string;
  type: ChannelType;
  description: string | null;
  createdById: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: UUID;
  channelId: UUID;
  userId: UUID;
  lastReadAt: string | null;
  mutedUntil: string | null;
  joinedAt: string;
  user?: User;
}

export interface Message {
  id: UUID;
  channelId: UUID;
  authorId: UUID;
  parentId: UUID | null;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  attachments?: Attachment[];
}

export interface Attachment {
  id: UUID;
  messageId: UUID;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResult<T> = ApiResponse<T> | ApiFailure;
