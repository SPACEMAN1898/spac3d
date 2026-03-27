import { useEffect, useRef } from 'react';
import { usePresenceStore } from '../../stores/presenceStore';

interface Props {
  user: { id: string; displayName: string; avatarUrl: string | null; email?: string; status?: string };
  position: { x: number; y: number };
  onClose: () => void;
  onDm: () => void;
}

export default function UserPopover({ user, position, onClose, onDm }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const getStatus = usePresenceStore((s) => s.getStatus);
  const status = getStatus(user.id);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const statusText = status === 'ONLINE' ? 'Online' : status === 'AWAY' ? 'Away' : 'Offline';
  const statusColor = status === 'ONLINE' ? 'bg-accent-green' : status === 'AWAY' ? 'bg-accent-yellow' : 'bg-gray-400';

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 rounded-lg border bg-white shadow-xl"
      style={{ top: position.y, left: position.x }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-lg" />
            ) : (
              user.displayName[0]?.toUpperCase()
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusColor}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.displayName}</p>
            <p className="text-xs text-gray-500">{statusText}</p>
          </div>
        </div>
        {user.email && (
          <p className="mb-3 text-sm text-gray-500">{user.email}</p>
        )}
        <button
          onClick={() => { onDm(); onClose(); }}
          className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
