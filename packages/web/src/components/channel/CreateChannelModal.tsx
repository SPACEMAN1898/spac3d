import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import api from '../../lib/api';

interface Props {
  orgId: string;
  open: boolean;
  onClose: () => void;
}

export default function CreateChannelModal({ orgId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/v1/orgs/${orgId}/channels`, { name, type, topic: topic || undefined });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', orgId] });
      setName('');
      setType('PUBLIC');
      setTopic('');
      setError('');
      onClose();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || 'Failed to create channel');
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Channel">
      {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="new-channel"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Topic (optional)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="What's this channel about?"
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={type === 'PUBLIC'} onChange={() => setType('PUBLIC')} className="accent-primary" />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={type === 'PRIVATE'} onChange={() => setType('PRIVATE')} className="accent-primary" />
            Private
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
