import { useQuery } from "@tanstack/react-query";
import { EVENT_FILTERS } from "../../../lib/filterGroups";
import { getFilteredFilters, useStore } from "../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchEventNames, EventName } from "../endpoints";

export function useGetEventNames() {
  const { site, time } = useStore();

  const filteredFilters = getFilteredFilters(EVENT_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["event-names", site, time, filteredFilters],
    enabled: !!site,
    queryFn: () =>
      fetchEventNames(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      }),
  });
}
