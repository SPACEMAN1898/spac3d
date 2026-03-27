import { formatDate } from '@clinikchat/shared';

interface MessageData {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
}

interface MessageItemProps {
  message: MessageData;
  isGrouped: boolean;
}

export default function MessageItem({ message, isGrouped }: MessageItemProps) {
  const displayName = message.user?.displayName || 'Unknown';
  const initial = displayName[0]?.toUpperCase() || '?';

  if (isGrouped) {
    return (
      <div className="group flex items-start px-6 py-0.5 hover:bg-gray-50">
        <div className="w-9 flex-shrink-0">
          <span className="hidden text-xs text-gray-400 group-hover:inline">
            {new Date(message.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="ml-2 min-w-0 flex-1">
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start px-6 py-2 hover:bg-gray-50">
      <div className="mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-primary text-sm font-bold text-white">
        {message.user?.avatarUrl ? (
          <img src={message.user.avatarUrl} alt="" className="h-9 w-9 rounded" />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">{displayName}</span>
          <span className="text-xs text-gray-400">
            {formatDate(message.createdAt)}
          </span>
          {message.editedAt && <span className="text-xs text-gray-400">(edited)</span>}
        </div>
        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
