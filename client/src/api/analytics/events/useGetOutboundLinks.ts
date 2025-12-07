import { useQuery } from "@tanstack/react-query";
import { EVENT_FILTERS } from "../../../lib/filterGroups";
import { getFilteredFilters, useStore } from "../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchOutboundLinks, OutboundLink } from "../endpoints";

export function useGetOutboundLinks() {
  const { site, time } = useStore();

  const filteredFilters = getFilteredFilters(EVENT_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["outbound-links", site, time, filteredFilters],
    enabled: !!site,
    queryFn: () =>
      fetchOutboundLinks(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      }),
  });
}
