import type { UserProfile } from './user.js';

export type MessageType = 'TEXT' | 'SYSTEM' | 'FILE';

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url?: string;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: MessageType;
  parentId: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserProfile;
  attachments?: Attachment[];
}

export interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}
