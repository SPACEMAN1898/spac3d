import { useMemo } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES, SOCKET_EVENTS } from "@clinikchat/shared";
import type { User } from "@clinikchat/shared";
import { api } from "../lib/api.js";
import { useAuthStore } from "../stores/authStore.js";
import { getSocket } from "../lib/socket.js";
import type { OrgSummary } from "../hooks/useOrgBySlug.js";

export interface ChannelListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  lastReadAt: string | null;
  lastMessageAt: string | null;
  lastMessageId: string | null;
}

function channelUnread(c: ChannelListItem): boolean {
  if (!c.lastMessageAt) return false;
  if (!c.lastReadAt) return true;
  return new Date(c.lastMessageAt).getTime() > new Date(c.lastReadAt).getTime();
}

export function Sidebar({
  org,
  orgs,
  me,
}: {
  org: OrgSummary | undefined;
  orgs: OrgSummary[] | undefined;
  me: User | null;
}) {
  const { orgSlug, channelId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const { data: channels } = useQuery({
    queryKey: ["channels", org?.id],
    enabled: Boolean(org?.id),
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: ChannelListItem[] }>(
        API_ROUTES.CHANNELS.BASE(org!.id),
      );
      return data.data;
    },
  });

  const regular = useMemo(
    () => channels?.filter((c) => c.type !== "dm") ?? [],
    [channels],
  );
  const dms = useMemo(() => channels?.filter((c) => c.type === "dm") ?? [], [channels]);

  const logoutMut = useMutation({
    mutationFn: async () => {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    },
    onSettled: () => {
      logoutStore();
      void navigate("/login", { replace: true });
    },
  });

  function onOrgChange(nextSlug: string) {
    const nextOrg = orgs?.find((o) => o.slug === nextSlug);
    if (!nextOrg) return;
    void queryClient.prefetchQuery({
      queryKey: ["channels", nextOrg.id],
      queryFn: async () => {
        const { data } = await api.get<{ success: true; data: ChannelListItem[] }>(
          API_ROUTES.CHANNELS.BASE(nextOrg.id),
        );
        return data.data;
      },
    });
    void queryClient
      .fetchQuery({
        queryKey: ["channels", nextOrg.id],
        queryFn: async () => {
          const { data } = await api.get<{ success: true; data: ChannelListItem[] }>(
            API_ROUTES.CHANNELS.BASE(nextOrg.id),
          );
          return data.data;
        },
      })
      .then((list) => {
        const first = list[0]?.id ?? "new";
        void navigate(`/app/${nextSlug}/${first}`, { replace: true });
      })
      .catch(() => undefined);
  }

  function cycleStatus() {
    const order: User["status"][] = ["online", "away", "offline"];
    const current = me?.status ?? "offline";
    const next = order[(order.indexOf(current) + 1) % order.length]!;
    void api.patch(API_ROUTES.USERS.ME, { status: next }).then((res) => {
      const u = (res.data as { success: true; data: User }).data;
      setUser(u);
      const sock = getSocket();
      if (sock && org?.id) {
        sock.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { organizationId: org.id, status: next });
      }
    });
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 p-3">
        <label className="sr-only" htmlFor="org-switch">
          Organization
        </label>
        <select
          id="org-switch"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={orgSlug ?? ""}
          onChange={(e) => onOrgChange(e.target.value)}
        >
          {(orgs ?? []).map((o) => (
            <option key={o.id} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Channels
        </p>
        <nav className="mt-2 space-y-0.5">
          {regular.map((c) => (
            <NavLink
              key={c.id}
              to={`/app/${orgSlug}/${c.id}`}
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                  isActive || channelId === c.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60",
                ].join(" ")
              }
            >
              <span className="truncate"># {c.name}</span>
              {channelUnread(c) && (
                <span className="ml-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
              )}
            </NavLink>
          ))}
        </nav>

        <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Direct messages
        </p>
        <nav className="mt-2 space-y-0.5">
          {dms.map((c) => (
            <NavLink
              key={c.id}
              to={`/app/${orgSlug}/${c.id}`}
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                  isActive || channelId === c.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60",
                ].join(" ")
              }
            >
              <span className="truncate">{c.name}</span>
              {channelUnread(c) && (
                <span className="ml-2 inline-flex h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
            {(me?.displayName ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{me?.displayName}</p>
            <button
              type="button"
              onClick={cycleStatus}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Status: {me?.status ?? "offline"} (click to cycle)
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logoutMut.mutate()}
          className="mt-3 w-full rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
