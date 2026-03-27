import { clsx } from 'clsx'

interface AvatarProps {
  src?: string | null | undefined
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  status?: 'ONLINE' | 'AWAY' | 'OFFLINE'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] ?? 'bg-gray-500'
}

export function Avatar({ src, name, size = 'md', status, className }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const statusClasses = {
    ONLINE: 'bg-green-400',
    AWAY: 'bg-yellow-400',
    OFFLINE: 'bg-gray-400',
  }

  return (
    <div className={clsx('relative flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center text-white font-semibold',
            sizeClasses[size],
            getColorFromName(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-sidebar-bg',
            statusClasses[status],
            size === 'xs' ? 'w-2 h-2' : 'w-2.5 h-2.5',
          )}
        />
      )}
    </div>
  )
}
