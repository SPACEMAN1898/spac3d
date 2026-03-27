import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@clinikchat/shared";
import { api } from "../lib/api.js";

interface OrgRow {
  id: string;
  slug: string;
  name: string;
}

interface ChannelRow {
  id: string;
}

export function DefaultAppRedirect() {
  const navigate = useNavigate();
  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: OrgRow[] }>(API_ROUTES.ORGS.BASE);
      return data.data;
    },
  });

  const firstOrgId = orgs?.[0]?.id;
  const { data: channels, isLoading: chLoading } = useQuery({
    queryKey: ["channels", firstOrgId],
    enabled: Boolean(firstOrgId),
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: ChannelRow[] }>(
        API_ROUTES.CHANNELS.BASE(firstOrgId!),
      );
      return data.data;
    },
  });

  useEffect(() => {
    if (orgsLoading) return;
    if (!orgs?.length) {
      void navigate("/app/welcome", { replace: true });
      return;
    }
    const org = orgs[0]!;
    if (chLoading) return;
    const channelId = channels?.[0]?.id ?? "new";
    void navigate(`/app/${org.slug}/${channelId}`, { replace: true });
  }, [orgs, channels, orgsLoading, chLoading, navigate]);

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 text-slate-600">
      Loading workspace…
    </div>
  );
}
