import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getFilteredFilters, useStore } from "../../lib/store";
import { SESSION_PAGE_FILTERS } from "../../lib/filterGroups";
import { APIResponse } from "../types";
import { getStartAndEndDate, timeZone } from "../utils";
import {
  fetchSessions,
  fetchSession,
  fetchUserSessionCount,
  GetSessionsResponse,
  SessionDetails,
  SessionEventProps,
  SessionEvent,
  SessionPageviewsAndEvents,
  UserSessionCountResponse,
} from "./endpoints";

export function useGetSessions(
  userId?: string,
  page: number = 1,
  limit: number = 100,
  identifiedOnly: boolean = false
) {
  const { time, site } = useStore();

  const filteredFilters = getFilteredFilters(SESSION_PAGE_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery<{ data: GetSessionsResponse }>({
    queryKey: ["sessions", time, site, filteredFilters, userId, page, limit, identifiedOnly],
    queryFn: () => {
      // For past-minutes mode or when filtering by userId, handle time differently
      const effectiveStartDate = time.mode === "past-minutes" || userId ? "" : (startDate ?? "");
      const effectiveEndDate = time.mode === "past-minutes" || userId ? "" : (endDate ?? "");

      return fetchSessions(site, {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        timeZone,
        filters: filteredFilters,
        page,
        limit,
        userId,
        identifiedOnly,
      });
    },
    staleTime: Infinity,
  });
}

export function useGetSessionsInfinite(userId?: string) {
  const { time, site } = useStore();

  const filteredFilters = getFilteredFilters(SESSION_PAGE_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  return useInfiniteQuery<{ data: GetSessionsResponse }>({
    queryKey: ["sessions-infinite", time, site, filteredFilters, userId],
    queryFn: ({ pageParam = 1 }) => {
      // For past-minutes mode or when filtering by userId, handle time differently
      const effectiveStartDate = time.mode === "past-minutes" || userId ? "" : (startDate ?? "");
      const effectiveEndDate = time.mode === "past-minutes" || userId ? "" : (endDate ?? "");

      return fetchSessions(site, {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        timeZone,
        filters: filteredFilters,
        page: pageParam as number,
        userId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: { data: GetSessionsResponse }, allPages) => {
      // If we have data and it's a full page (100 items), there might be more
      if (lastPage?.data && lastPage.data.length === 100) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: Infinity,
  });
}

export function useGetSessionDetailsInfinite(sessionId: string | null) {
  const { site, time } = useStore();
  const pastMinutesMode = time.mode === "past-minutes";

  // Get minutes based on the time mode
  let minutes: number | undefined;
  if (pastMinutesMode && time.mode === "past-minutes") {
    minutes = time.pastMinutesStart;
  }

  return useInfiniteQuery<{ data: SessionPageviewsAndEvents }>({
    queryKey: ["session-details-infinite", sessionId, site, minutes],
    queryFn: ({ pageParam = 0 }) => {
      if (!sessionId) throw new Error("Session ID is required");

      return fetchSession(site, {
        sessionId,
        limit: 100,
        offset: pageParam as number,
        minutes: pastMinutesMode ? minutes : undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      if (lastPage?.data?.pagination?.hasMore) {
        return lastPage.data.pagination.offset + lastPage.data.pagination.limit;
      }
      return undefined;
    },
    enabled: !!sessionId && !!site,
    staleTime: Infinity,
  });
}

export function useGetUserSessionCount(userId: string) {
  const { site } = useStore();

  return useQuery<{ data: UserSessionCountResponse[] }>({
    queryKey: ["user-session-count", userId, site],
    queryFn: () => {
      return fetchUserSessionCount(site, {
        userId,
        timeZone,
      });
    },
    staleTime: Infinity,
  });
}
