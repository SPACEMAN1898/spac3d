import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, SOCKET_EVENTS } from "@clinikchat/shared";
import type { User } from "@clinikchat/shared";
import { api } from "../lib/api.js";
import { useAuthStore } from "../stores/authStore.js";
import { connectSocket, getSocket } from "../lib/socket.js";
import { Sidebar } from "../components/Sidebar.js";
import { useOrgBySlug } from "../hooks/useOrgBySlug.js";

export function AppShellPage() {
  const { orgSlug } = useParams();
  const { org, orgs } = useOrgBySlug(orgSlug);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: User }>(API_ROUTES.USERS.ME);
      return data.data;
    },
  });

  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  useEffect(() => {
    try {
      const s = connectSocket();
      if (org?.id) {
        s.emit(SOCKET_EVENTS.JOIN_ORG, { organizationId: org.id });
      }
    } catch {
      /* no token */
    }
  }, [org?.id]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !org?.id) return;
    s.emit(SOCKET_EVENTS.JOIN_ORG, { organizationId: org.id });
  }, [org?.id]);

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <Sidebar org={org} orgs={orgs} me={me ?? user} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
