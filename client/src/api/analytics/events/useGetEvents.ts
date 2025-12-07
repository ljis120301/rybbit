import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Time } from "../../../components/DateSelector/types";
import { useStore } from "../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchEvents, Event, EventsResponse } from "../endpoints";

export interface GetEventsOptions {
  time?: Time;
  page?: number;
  pageSize?: number;
  count?: number; // For backward compatibility
  isRealtime?: boolean;
}

export function useGetEvents(count = 10) {
  const { site } = useStore();

  return useQuery({
    queryKey: ["events", site, count],
    refetchInterval: 5000,
    queryFn: () =>
      fetchEvents(site, {
        startDate: "",
        endDate: "",
        timeZone,
        limit: count,
      }).then(res => res.data),
  });
}

// Hook with pagination and filtering support
export function useGetEventsInfinite(options: GetEventsOptions = {}) {
  const { site, time, filters } = useStore();
  const pageSize = options.pageSize || 20;

  const { startDate, endDate } = getStartAndEndDate(time);

  return useInfiniteQuery<EventsResponse, Error>({
    queryKey: ["events-infinite", site, time, filters, pageSize, options.isRealtime],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return fetchEvents(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: filters && filters.length > 0 ? filters : undefined,
        page: pageParam as number,
        pageSize,
        limit: options.count,
      });
    },
    getNextPageParam: (lastPage: EventsResponse) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    refetchInterval: options.isRealtime ? 5000 : undefined,
  });
}
