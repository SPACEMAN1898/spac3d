import { useState } from 'react'
import { clsx } from 'clsx'
import type { Message } from '@clinikchat/shared'
import { formatTime, formatRelativeTime } from '@clinikchat/shared'
import { Avatar } from '../ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface MessageItemProps {
  message: Message
  isGrouped: boolean
  channelId: string
}

export function MessageItem({ message, isGrouped, channelId }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isHovered, setIsHovered] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const isOwn = message.userId === currentUser?.id

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false)
      return
    }
    try {
      await apiClient.patch(`/messages/${message.id}`, { content: editContent })
      setIsEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    try {
      await apiClient.delete(`/messages/${message.id}`)
      await queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const displayName = message.user?.displayName ?? 'Unknown User'

  return (
    <div
      className={clsx(
        'group flex gap-2 px-4 py-0.5 hover:bg-gray-50 relative',
        !isGrouped && 'pt-2',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isGrouped ? (
        <Avatar
          src={message.user?.avatarUrl}
          name={displayName}
          size="sm"
          className="mt-0.5 flex-shrink-0"
        />
      ) : (
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {isHovered && (
            <span className="text-xs text-gray-400">
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-gray-900">{displayName}</span>
            <span className="text-xs text-gray-400" title={message.createdAt}>
              {formatRelativeTime(message.createdAt)}
            </span>
            {message.editedAt && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-brand-500 rounded px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleEdit()
                }
                if (e.key === 'Escape') {
                  setIsEditing(false)
                  setEditContent(message.content)
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 text-xs">
              <button onClick={handleEdit} className="text-brand-600 hover:text-brand-700 font-medium">
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(message.content)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}
      </div>

      {/* Hover actions */}
      {isHovered && !isEditing && (
        <div className="absolute right-4 top-0 transform -translate-y-1/2 flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm px-1 py-0.5">
          {isOwn && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-500 hover:text-gray-700 px-1 py-0.5"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-700 px-1 py-0.5"
                title="Delete"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
