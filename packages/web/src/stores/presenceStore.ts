import { create } from 'zustand';

type UserStatus = 'ONLINE' | 'AWAY' | 'OFFLINE';

interface PresenceState {
  statuses: Record<string, UserStatus>;
  setStatus: (userId: string, status: UserStatus) => void;
  getStatus: (userId: string) => UserStatus;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  statuses: {},
  setStatus: (userId, status) =>
    set((state) => ({
      statuses: { ...state.statuses, [userId]: status },
    })),
  getStatus: (userId) => get().statuses[userId] || 'OFFLINE',
}));
