import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../components/DateSelector/types";
import { JOURNEY_PAGE_FILTERS } from "../../../lib/filterGroups";
import { getFilteredFilters } from "../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchJourneys, Journey, JourneysResponse } from "../endpoints";

export interface JourneyParams {
  siteId?: number;
  steps?: number;
  timeZone?: string;
  time: Time;
  limit?: number;
  stepFilters?: Record<number, string>;
}

export const useJourneys = ({ siteId, steps = 3, time, limit = 100, stepFilters }: JourneyParams) => {
  const filteredFilters = getFilteredFilters(JOURNEY_PAGE_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery<JourneysResponse>({
    queryKey: ["journeys", siteId, steps, time, limit, filteredFilters, stepFilters],
    queryFn: () =>
      fetchJourneys(siteId!, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        steps,
        limit,
        filters: filteredFilters,
        stepFilters,
      }),
    enabled: !!siteId,
    placeholderData: previousData => previousData,
  });
};
