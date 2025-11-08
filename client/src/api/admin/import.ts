import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/api/utils";
import { APIResponse } from "@/api/types";
import type { ImportQuotaInfo } from "@/lib/import/types";

interface GetSiteImportsResponse {
  importId: string;
  platform: "umami";
  status: "pending" | "processing" | "completed" | "failed";
  importedEvents: number;
  errorMessage: string | null;
  startedAt: string;
  fileName: string;
}

interface ImportSiteDataParams {
  file: File;
  platform: string;
  startDate?: string;
  endDate?: string;
}

interface ImportSiteDataResponse {
  message: string;
}

interface DeleteImportResponse {
  message: string;
}

export function useGetSiteImports(site: number) {
  return useQuery({
    queryKey: ["get-site-imports", site],
    queryFn: async () => await authedFetch<APIResponse<GetSiteImportsResponse[]>>(`/get-site-imports/${site}`),
    refetchInterval: data => {
      const hasActiveImports = data.state.data?.data.some(
        imp => imp.status === "processing" || imp.status === "pending"
      );
      return hasActiveImports ? 5000 : false;
    },
    placeholderData: { data: [] },
    staleTime: 30000,
  });
}

export function useImportSiteData(site: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportSiteDataParams) => {
      const formData = new FormData();

      formData.append("platform", params.platform);
      if (params.startDate) {
        formData.append("startDate", params.startDate);
      }
      if (params.endDate) {
        formData.append("endDate", params.endDate);
      }
      formData.append("file", params.file);

      return await authedFetch<APIResponse<ImportSiteDataResponse>>(`/import-site-data/${site}`, undefined, {
        method: "POST",
        data: formData,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["get-site-imports", site],
      });
    },
    retry: false,
  });
}

export function useDeleteSiteImport(site: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (importId: string) => {
      return await authedFetch<APIResponse<DeleteImportResponse>>(
        `/delete-site-import/${site}/${importId}`,
        undefined,
        {
          method: "DELETE",
        }
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["get-site-imports", site],
      });
    },
    retry: false,
  });
}

export function useGetImportQuota(site: number) {
  return useQuery({
    queryKey: ["import-quota", site],
    queryFn: async () => await authedFetch<APIResponse<ImportQuotaInfo>>(`/import-quota/${site}`),
    staleTime: 60000,
  });
}
