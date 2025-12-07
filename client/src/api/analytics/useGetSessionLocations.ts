import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../lib/store";
import { getStartAndEndDate, timeZone } from "../utils";
import { fetchSessionLocations, LiveSessionLocation } from "./endpoints";

export function useGetSessionLocations() {
  const { time, site, filters } = useStore();

  const { startDate, endDate } = getStartAndEndDate(time);

  // Filter out location-related filters to avoid circular dependencies
  const locationExcludedFilters = filters.filter(
    f =>
      f.parameter !== "lat" &&
      f.parameter !== "lon" &&
      f.parameter !== "city" &&
      f.parameter !== "country" &&
      f.parameter !== "region"
  );

  return useQuery<LiveSessionLocation[]>({
    queryKey: ["session-locations", site, time, filters],
    queryFn: () => {
      return fetchSessionLocations(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: locationExcludedFilters,
      });
    },
  });
}
