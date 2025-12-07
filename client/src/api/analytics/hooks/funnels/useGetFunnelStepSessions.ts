import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../../components/DateSelector/types";
import { FUNNEL_PAGE_FILTERS } from "../../../../lib/filterGroups";
import { getFilteredFilters } from "../../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../../utils";
import { fetchFunnelStepSessions, FunnelStep, GetSessionsResponse } from "../../endpoints";

export function useGetFunnelStepSessions({
  steps,
  stepNumber,
  siteId,
  time,
  mode,
  page = 1,
  limit = 25,
  enabled = false,
}: {
  steps: FunnelStep[];
  stepNumber: number;
  siteId: number;
  time: Time;
  mode: "reached" | "dropped";
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const filteredFilters = getFilteredFilters(FUNNEL_PAGE_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["funnel-step-sessions", steps, stepNumber, siteId, time, mode, page, limit, filteredFilters],
    queryFn: async () => {
      return fetchFunnelStepSessions(siteId, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: filteredFilters,
        steps,
        stepNumber,
        mode,
        page,
        limit,
      });
    },
    enabled: !!siteId && !!steps && steps.length >= 2 && enabled,
  });
}
