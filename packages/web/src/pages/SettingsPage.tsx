import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/api/v1/users/me', { displayName });
      return data.data;
    },
    onSuccess: (data) => {
      const current = useAuthStore.getState();
      if (current.accessToken && current.refreshToken) {
        setAuth({ accessToken: current.accessToken, refreshToken: current.refreshToken, user: { ...current.user!, displayName: data.displayName, avatarUrl: data.avatarUrl } });
      }
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.post('/api/v1/users/me/avatar', form);
      return data.data;
    },
    onSuccess: (data) => {
      const current = useAuthStore.getState();
      if (current.accessToken && current.refreshToken) {
        setAuth({ accessToken: current.accessToken, refreshToken: current.refreshToken, user: { ...current.user!, avatarUrl: data.avatarUrl } });
      }
      toast.success('Avatar updated');
    },
    onError: () => toast.error('Failed to upload avatar'),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/users/me/password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed');
    },
    onError: () => toast.error('Failed to change password'),
  });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Profile</h2>
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center gap-4">
            <div
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg bg-primary text-2xl font-bold text-white hover:opacity-80"
              onClick={() => fileRef.current?.click()}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-lg" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadAvatar.mutate(e.target.files[0]); }}
            />
            <div>
              <p className="font-medium">{user?.displayName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <button onClick={() => fileRef.current?.click()} className="mt-1 text-sm text-primary hover:underline">
                Change avatar
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Change Password</h2>
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Minimum 8 characters"
            />
          </div>
          <button
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending || !currentPassword || !newPassword}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Change Password
          </button>
        </div>
      </section>
    </div>
  );
}
