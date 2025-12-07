import { useQuery } from "@tanstack/react-query";
import { Time } from "../../../../components/DateSelector/types";
import { getStartAndEndDate, timeZone } from "../../../utils";
import { fetchGoalSessions, GetSessionsResponse } from "../../endpoints";

export function useGetGoalSessions({
  goalId,
  siteId,
  time,
  page = 1,
  limit = 25,
  enabled = false,
}: {
  goalId: number;
  siteId: number;
  time: Time;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["goal-sessions", goalId, siteId, time, page, limit],
    queryFn: async () => {
      return fetchGoalSessions(siteId, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        goalId,
        page,
        limit,
      });
    },
    enabled: !!siteId && !!goalId && enabled,
  });
}
