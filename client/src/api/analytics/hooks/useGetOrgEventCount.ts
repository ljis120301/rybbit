import { useQuery } from "@tanstack/react-query";
import { fetchOrgEventCount, OrgEventCountResponse, GetOrgEventCountResponse } from "../endpoints";

export function useGetOrgEventCount({
  organizationId,
  startDate,
  endDate,
  timeZone = "UTC",
  enabled = true,
}: {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["org-event-count", organizationId, startDate, endDate, timeZone],
    queryFn: () =>
      fetchOrgEventCount(organizationId, {
        startDate,
        endDate,
        timeZone,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
