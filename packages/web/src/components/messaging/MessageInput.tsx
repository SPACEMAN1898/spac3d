import { useState, useRef, useCallback, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import toast from 'react-hot-toast';
import { getSocket } from '../../lib/socket';
import { SocketEvents } from '@clinikchat/shared';
import api from '../../lib/api';
import FilePreview from '../file/FilePreview';
import UploadProgress from '../file/UploadProgress';

interface StagedFile {
  file: File;
  preview?: string;
}

interface UploadState {
  filename: string;
  progress: number;
}

interface MessageInputProps {
  channelId: string;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function MessageInput({ channelId, editingMessage, onCancelEdit }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitTypingStart = useCallback(() => {
    const socket = getSocket();
    if (!socket || isTyping.current) return;
    isTyping.current = true;
    socket.emit(SocketEvents.TYPING_START, { channelId });
  }, [channelId]);

  const emitTypingStop = useCallback(() => {
    const socket = getSocket();
    if (!socket || !isTyping.current) return;
    isTyping.current = false;
    socket.emit(SocketEvents.TYPING_STOP, { channelId });
  }, [channelId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    if (!editingMessage) {
      emitTypingStart();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => emitTypingStop(), 3000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape' && editingMessage && onCancelEdit) {
      onCancelEdit();
      setContent('');
    }
  }

  async function sendMessage() {
    const trimmed = content.trim();

    if (stagedFiles.length > 0) {
      await uploadFiles();
    }

    if (!trimmed) {
      if (stagedFiles.length === 0) return;
      return;
    }

    const socket = getSocket();

    if (editingMessage) {
      if (socket) {
        socket.emit(SocketEvents.MESSAGE_EDIT, { messageId: editingMessage.id, content: trimmed });
      }
      onCancelEdit?.();
    } else {
      if (socket) {
        socket.emit(SocketEvents.MESSAGE_NEW, { channelId, content: trimmed });
      }
    }

    setContent('');
    emitTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }

  async function uploadFiles() {
    for (const sf of stagedFiles) {
      const form = new FormData();
      form.append('file', sf.file);

      setUploads((prev) => [...prev, { filename: sf.file.name, progress: 0 }]);

      try {
        await api.post(`/api/v1/channels/${channelId}/upload`, form, {
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / (e.total || 1));
            setUploads((prev) => prev.map((u) => u.filename === sf.file.name ? { ...u, progress: pct } : u));
          },
        });
      } catch {
        toast.error(`Failed to upload ${sf.file.name}`);
      }
    }

    setStagedFiles([]);
    setTimeout(() => setUploads([]), 1000);
  }

  function stageFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const toStage: StagedFile[] = [];

    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds 25MB limit`);
        continue;
      }

      const sf: StagedFile = { file: f };
      if (f.type.startsWith('image/')) {
        sf.preview = URL.createObjectURL(f);
      }
      toStage.push(sf);
    }

    setStagedFiles((prev) => [...prev, ...toStage]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      stageFiles(e.dataTransfer.files);
    }
  }

  function handleEmojiSelect(emoji: { native: string }) {
    setContent((prev) => prev + emoji.native);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary-light/50">
          <p className="text-lg font-medium text-primary">Drop files here</p>
        </div>
      )}

      {editingMessage && (
        <div className="flex items-center gap-2 border-t border-blue-100 bg-blue-50 px-6 py-2 text-sm text-blue-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editing message
          <button onClick={() => { onCancelEdit?.(); setContent(''); }} className="ml-auto text-blue-500 hover:text-blue-700">Cancel</button>
        </div>
      )}

      <FilePreview files={stagedFiles} onRemove={(i) => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i))} />
      <UploadProgress uploads={uploads} />

      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex items-end rounded-lg border border-gray-300 bg-white p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mr-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Attach file"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) stageFiles(e.target.files); e.target.value = ''; }}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
            style={{ minHeight: '24px' }}
          />

          <div className="relative" ref={emojiRef}>
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="mx-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Emoji"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmoji && (
              <div className="absolute bottom-10 right-0 z-20">
                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" />
              </div>
            )}
          </div>

          <button
            onClick={sendMessage}
            disabled={!content.trim() && stagedFiles.length === 0}
            className="rounded bg-primary p-1.5 text-white transition hover:bg-primary-hover disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
