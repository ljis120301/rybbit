import { useQuery } from "@tanstack/react-query";
import { getFilteredFilters, useStore } from "../../../../lib/store";
import { GOALS_PAGE_FILTERS } from "../../../../lib/filterGroups";
import { getStartAndEndDate, timeZone } from "../../../utils";
import { fetchGoals, Goal, PaginationMeta, GoalsResponse } from "../../endpoints";

export function useGetGoals({
  page = 1,
  pageSize = 10,
  sort = "createdAt",
  order = "desc",
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  sort?: "goalId" | "name" | "goalType" | "createdAt";
  order?: "asc" | "desc";
  enabled?: boolean;
}) {
  const { site, time } = useStore();
  const filteredFilters = getFilteredFilters(GOALS_PAGE_FILTERS);

  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["goals", site, time, filteredFilters, page, pageSize, sort, order],
    queryFn: async () => {
      return fetchGoals(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters: filteredFilters,
        page,
        pageSize,
        sort,
        order,
      });
    },
    enabled: !!site && enabled,
  });
}
