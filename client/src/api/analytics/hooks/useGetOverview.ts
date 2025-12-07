import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchOverview, GetOverviewResponse } from "../endpoints";

type PeriodTime = "current" | "previous";

type UseGetOverviewOptions = {
  periodTime?: PeriodTime;
  site?: number | string;
  overrideTime?:
    | { mode: "past-minutes"; pastMinutesStart: number; pastMinutesEnd: number }
    | { mode: "range"; startDate: string; endDate: string };
};

export function useGetOverview({ periodTime, site, overrideTime }: UseGetOverviewOptions) {
  const { time, previousTime, filters } = useStore();

  // Use overrideTime if provided, otherwise use store time
  const baseTime = overrideTime || time;
  const timeToUse = periodTime === "previous" ? previousTime : baseTime;

  const { startDate, endDate } = getStartAndEndDate(timeToUse);
  const queryKey = ["overview", timeToUse, site, filters];

  return useQuery({
    queryKey,
    queryFn: () => {
      // Build params based on time mode
      const params =
        timeToUse.mode === "past-minutes"
          ? {
              startDate: "",
              endDate: "",
              timeZone,
              filters,
              pastMinutesStart: timeToUse.pastMinutesStart,
              pastMinutesEnd: timeToUse.pastMinutesEnd,
            }
          : {
              startDate: startDate ?? "",
              endDate: endDate ?? "",
              timeZone,
              filters,
            };

      return fetchOverview(site!, params).then(data => ({ data }));
    },
    staleTime: 60_000,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey;
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
  });
}
