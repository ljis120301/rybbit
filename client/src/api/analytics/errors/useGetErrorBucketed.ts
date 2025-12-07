import { useStore } from "@/lib/store";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getStartAndEndDate, timeZone } from "../../utils";
import { fetchErrorBucketed, GetErrorBucketedResponse } from "../endpoints";

type UseGetErrorBucketedOptions = {
  errorMessage: string;
  enabled?: boolean;
};

export function useGetErrorBucketed({
  errorMessage,
  enabled = true,
}: UseGetErrorBucketedOptions): UseQueryResult<GetErrorBucketedResponse> {
  const { time, site, filters, bucket } = useStore();

  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["error-bucketed", time, site, filters, bucket, errorMessage],
    queryFn: () => {
      return fetchErrorBucketed(site, {
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        timeZone,
        filters,
        errorMessage,
        bucket,
      });
    },
    enabled: enabled && !!errorMessage && !!site,
    staleTime: Infinity,
  });
}
