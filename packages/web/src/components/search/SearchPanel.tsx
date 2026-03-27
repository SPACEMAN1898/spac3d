import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatDate } from '@clinikchat/shared';

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  channelId: string;
  onClose: () => void;
  onScrollToMessage: (messageId: string) => void;
}

export default function SearchPanel({ channelId, onClose, onScrollToMessage }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', channelId, debouncedQuery],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/channels/${channelId}/search?q=${encodeURIComponent(debouncedQuery)}`);
      return data.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  function highlightMatch(text: string, q: string) {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark>
        : part
    );
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          placeholder="Search messages..."
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && debouncedQuery.length >= 2 && (
          <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
        )}

        {results && results.length === 0 && debouncedQuery.length >= 2 && (
          <div className="p-4 text-center text-sm text-gray-400">No results found</div>
        )}

        {results?.map((r) => (
          <button
            key={r.id}
            onClick={() => onScrollToMessage(r.id)}
            className="w-full border-b px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{r.user.displayName}</span>
              <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
            </div>
            <p className="line-clamp-2 text-sm text-gray-600">
              {highlightMatch(r.content, debouncedQuery)}
            </p>
          </button>
        ))}

        {!debouncedQuery && (
          <div className="p-4 text-center text-sm text-gray-400">Type to search messages in this channel</div>
        )}
      </div>
    </div>
  );
}
