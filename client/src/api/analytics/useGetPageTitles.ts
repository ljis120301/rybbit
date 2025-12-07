import { useStore } from "@/lib/store";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getStartAndEndDate, timeZone } from "../utils";
import { fetchPageTitles, PageTitleItem, PageTitlesPaginatedResponse, PageTitlesStandardResponse } from "./endpoints";

type UseGetPageTitlesOptions = {
  limit?: number;
  page?: number;
  useFilters?: boolean;
};

// Hook for paginated fetching (e.g., for a dedicated "All Page Titles" screen)
export function useGetPageTitlesPaginated({
  limit = 10,
  page = 1,
  useFilters = true,
}: UseGetPageTitlesOptions): UseQueryResult<{ data: PageTitlesPaginatedResponse }> {
  const { time, site, filters } = useStore();

  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["page-titles", time, site, filters, limit, page],
    queryFn: async () => {
      const data = await fetchPageTitles(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: useFilters ? filters : undefined,
        limit,
        page,
      });
      return { data };
    },
    staleTime: Infinity,
  });
}
