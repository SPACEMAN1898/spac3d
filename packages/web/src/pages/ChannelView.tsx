import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import MessageList from '../components/messaging/MessageList';
import MessageInput from '../components/messaging/MessageInput';
import TypingIndicator from '../components/messaging/TypingIndicator';

export default function ChannelView() {
  const { channelId } = useParams<{ channelId: string }>();

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/channels/${channelId}`);
      return data.data;
    },
    enabled: !!channelId,
  });

  if (!channelId) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            # {channel?.name || 'Loading...'}
          </h2>
          {channel?.topic && <p className="text-sm text-gray-500">{channel.topic}</p>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {channel?.members?.length || 0} members
          </span>
        </div>
      </div>

      <MessageList channelId={channelId} />
      <TypingIndicator channelId={channelId} />
      <MessageInput channelId={channelId} />
    </div>
  );
}
