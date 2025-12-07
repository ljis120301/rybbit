import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { FUNNEL_PAGE_FILTERS } from "../../../../lib/filterGroups";
import { getFilteredFilters, useStore } from "../../../../lib/store";
import { getStartAndEndDate, timeZone } from "../../../utils";
import {
  analyzeFunnel,
  saveFunnel,
  FunnelStep,
  FunnelRequest,
  SaveFunnelRequest,
  FunnelResponse,
} from "../../endpoints";

/**
 * Hook for analyzing conversion funnels through a series of steps
 */
export function useGetFunnel(config?: FunnelRequest, debounce?: boolean) {
  const { site, time } = useStore();

  const debouncedConfig = useDebounce(config, 500);
  const filteredFilters = getFilteredFilters(FUNNEL_PAGE_FILTERS);
  const { startDate, endDate } = getStartAndEndDate(time);

  const configToUse = debounce ? debouncedConfig : config;

  return useQuery<FunnelResponse[], Error>({
    queryKey: ["funnel", site, time, filteredFilters, configToUse?.steps.map(s => s.value + s.type)],
    queryFn: async () => {
      if (!configToUse) {
        throw new Error("Funnel configuration is required");
      }

      try {
        return analyzeFunnel(site, {
          startDate: startDate ?? "",
          endDate: endDate ?? "",
          timeZone,
          filters: filteredFilters,
          steps: configToUse.steps,
          name: configToUse.name,
        });
      } catch (error) {
        throw new Error("Failed to analyze funnel");
      }
    },
    enabled: !!site && !!configToUse,
  });
}

/**
 * Hook for saving funnel configurations without analyzing them
 */
export function useSaveFunnel() {
  const { site } = useStore();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; funnelId: number }, Error, SaveFunnelRequest>({
    mutationFn: async funnelConfig => {
      try {
        const saveResponse = await saveFunnel(site, {
          steps: funnelConfig.steps,
          name: funnelConfig.name,
          reportId: funnelConfig.reportId,
        });

        // Invalidate the funnels query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["funnels", site] });

        return saveResponse;
      } catch (error) {
        throw new Error("Failed to save funnel");
      }
    },
  });
}
