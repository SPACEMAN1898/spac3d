import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@clinikchat/shared";
import { api } from "../lib/api.js";

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await api.get<{ success: true; data: OrgSummary[] }>(API_ROUTES.ORGS.BASE);
      return data.data;
    },
  });
}

export function useOrgBySlug(slug: string | undefined) {
  const { data: orgs, ...rest } = useOrganizations();
  const org = orgs?.find((o) => o.slug === slug);
  return { org, orgs, ...rest };
}
