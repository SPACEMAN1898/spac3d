import { useState } from 'react';
import { formatDate } from '@clinikchat/shared';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { SocketEvents } from '@clinikchat/shared';
import AttachmentView from '../file/AttachmentView';
import ContextMenu from '../ui/ContextMenu';

interface AttachmentData {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string | null;
}

interface MessageData {
  id: string;
  channelId?: string;
  content: string;
  type?: string;
  createdAt: string;
  editedAt: string | null;
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email?: string;
    status?: string;
  };
  attachments?: AttachmentData[];
}

interface Props {
  message: MessageData;
  isGrouped: boolean;
  onEditStart?: (messageId: string, content: string) => void;
  onImageClick?: (url: string, index: number) => void;
  onUserClick?: (user: NonNullable<MessageData['user']>, position: { x: number; y: number }) => void;
}

export default function MessageItem({ message, isGrouped, onEditStart, onImageClick, onUserClick }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwn = message.user?.id === currentUserId;
  const displayName = message.user?.displayName || 'Unknown';
  const initial = displayName[0]?.toUpperCase() || '?';
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!isOwn) return;
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleDelete() {
    const socket = getSocket();
    if (socket) {
      socket.emit(SocketEvents.MESSAGE_DELETE, { messageId: message.id });
    }
  }

  function handleAvatarClick(e: React.MouseEvent) {
    if (message.user && onUserClick) {
      onUserClick(message.user, { x: e.clientX, y: e.clientY });
    }
  }

  const attachments = (message.attachments || []) as AttachmentData[];

  if (isGrouped) {
    return (
      <>
        <div className="group flex items-start px-6 py-0.5 hover:bg-gray-50" onContextMenu={handleContextMenu}>
          <div className="w-9 flex-shrink-0">
            <span className="hidden text-xs text-gray-400 group-hover:inline">
              {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="ml-2 min-w-0 flex-1">
            <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message.content}</p>
            {attachments.length > 0 && (
              <AttachmentView attachments={attachments} onImageClick={onImageClick || (() => {})} />
            )}
          </div>
          {isOwn && (
            <div className="hidden items-center gap-1 group-hover:flex">
              {onEditStart && message.type !== 'FILE' && (
                <button onClick={() => onEditStart(message.id, message.content)} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600" title="Edit">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              )}
              <button onClick={handleDelete} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              ...(onEditStart && message.type !== 'FILE' ? [{ label: 'Edit message', onClick: () => onEditStart(message.id, message.content) }] : []),
              { label: 'Delete message', onClick: handleDelete, danger: true },
            ]}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="group flex items-start px-6 py-2 hover:bg-gray-50" onContextMenu={handleContextMenu}>
        <div
          className="mr-2 flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded bg-primary text-sm font-bold text-white"
          onClick={handleAvatarClick}
        >
          {message.user?.avatarUrl ? (
            <img src={message.user.avatarUrl} alt="" className="h-9 w-9 rounded" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="cursor-pointer text-sm font-semibold text-gray-900 hover:underline"
              onClick={handleAvatarClick}
            >
              {displayName}
            </span>
            <span className="text-xs text-gray-400">{formatDate(message.createdAt)}</span>
            {message.editedAt && <span className="text-xs text-gray-400">(edited)</span>}
          </div>
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message.content}</p>
          {attachments.length > 0 && (
            <AttachmentView attachments={attachments} onImageClick={onImageClick || (() => {})} />
          )}
        </div>
        {isOwn && (
          <div className="hidden items-center gap-1 group-hover:flex">
            {onEditStart && message.type !== 'FILE' && (
              <button onClick={() => onEditStart(message.id, message.content)} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600" title="Edit">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <button onClick={handleDelete} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            ...(onEditStart && message.type !== 'FILE' ? [{ label: 'Edit message', onClick: () => onEditStart(message.id, message.content) }] : []),
            { label: 'Delete message', onClick: handleDelete, danger: true },
          ]}
        />
      )}
    </>
  );
}
